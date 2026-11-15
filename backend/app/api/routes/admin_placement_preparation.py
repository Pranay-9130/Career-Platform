import uuid
import os
from pathlib import Path
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    Form,
    status,
)
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.dependencies.auth import require_role, get_current_active_user
from app.models.user import User, UserRole
from app.models.placement_preparation import (
    PreparationRole,
    PreparationTopic,
    PreparationMaterial,
)
from app.schemas.placement_preparation import (
    RoleCreate,
    RoleUpdate,
    RoleRead,
    TopicCreate,
    TopicUpdate,
    TopicRead,
    MaterialRead,
    MaterialUpdate,
)
from app.services.placement_prep_service import (
    get_upload_dir,
    slugify,
    format_file_size,
    validate_pdf_content,
    get_pdf_page_count,
    MAX_FILE_SIZE,
)

router = APIRouter(
    prefix="/admin/placement-preparation",
    tags=["Admin - Placement Preparation"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# ==============================================================================
# 1. ROLES MANAGEMENT
# ==============================================================================

@router.get("/roles", response_model=List[RoleRead])
async def admin_list_roles(db: AsyncSession = Depends(get_db)):
    """
    List all preparation roles (including inactive) with topic categories and material counts.
    """
    stmt = (
        select(PreparationRole)
        .options(selectinload(PreparationRole.topics))
        .order_by(PreparationRole.display_order.asc(), PreparationRole.name.asc())
    )
    result = await db.execute(stmt)
    roles = result.scalars().all()

    # Total materials count per role (including unpublished)
    count_stmt = (
        select(PreparationMaterial.role_id, func.count(PreparationMaterial.id))
        .group_by(PreparationMaterial.role_id)
    )
    role_counts = dict((await db.execute(count_stmt)).all())

    topic_count_stmt = (
        select(PreparationMaterial.topic_id, func.count(PreparationMaterial.id))
        .where(PreparationMaterial.topic_id.isnot(None))
        .group_by(PreparationMaterial.topic_id)
    )
    topic_counts = dict((await db.execute(topic_count_stmt)).all())

    output = []
    for r in roles:
        role_topics = [
            TopicRead(
                id=t.id,
                role_id=t.role_id,
                name=t.name,
                slug=t.slug,
                description=t.description,
                display_order=t.display_order,
                material_count=topic_counts.get(t.id, 0),
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
            for t in r.topics
        ]

        output.append(
            RoleRead(
                id=r.id,
                name=r.name,
                slug=r.slug,
                description=r.description,
                icon_name=r.icon_name,
                is_active=r.is_active,
                display_order=r.display_order,
                material_count=role_counts.get(r.id, 0),
                topics=role_topics,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )
    return output


@router.post("/roles", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
async def admin_create_role(
    payload: RoleCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new placement preparation role.
    """
    role_slug = payload.slug or slugify(payload.name)

    # Check uniqueness
    existing_stmt = select(PreparationRole).where(PreparationRole.slug == role_slug)
    if (await db.execute(existing_stmt)).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A role with slug '{role_slug}' already exists.",
        )

    role = PreparationRole(
        name=payload.name.strip(),
        slug=role_slug,
        description=payload.description,
        icon_name=payload.icon_name or "Terminal",
        is_active=payload.is_active,
        display_order=payload.display_order,
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)

    return RoleRead(
        id=role.id,
        name=role.name,
        slug=role.slug,
        description=role.description,
        icon_name=role.icon_name,
        is_active=role.is_active,
        display_order=role.display_order,
        material_count=0,
        topics=[],
        created_at=role.created_at,
        updated_at=role.updated_at,
    )


@router.put("/roles/{role_id}", response_model=RoleRead)
async def admin_update_role(
    role_id: uuid.UUID,
    payload: RoleUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a placement preparation role.
    """
    stmt = (
        select(PreparationRole)
        .where(PreparationRole.id == role_id)
        .options(selectinload(PreparationRole.topics))
    )
    role = (await db.execute(stmt)).scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Preparation role not found.")

    if payload.name is not None:
        role.name = payload.name.strip()
    if payload.slug is not None:
        new_slug = slugify(payload.slug)
        if new_slug != role.slug:
            existing = (
                await db.execute(
                    select(PreparationRole).where(
                        and_(PreparationRole.slug == new_slug, PreparationRole.id != role_id)
                    )
                )
            ).scalars().first()
            if existing:
                raise HTTPException(
                    status_code=400,
                    detail=f"A role with slug '{new_slug}' already exists.",
                )
            role.slug = new_slug
    if payload.description is not None:
        role.description = payload.description
    if payload.icon_name is not None:
        role.icon_name = payload.icon_name
    if payload.is_active is not None:
        role.is_active = payload.is_active
    if payload.display_order is not None:
        role.display_order = payload.display_order

    await db.commit()
    await db.refresh(role)

    count_stmt = select(func.count(PreparationMaterial.id)).where(PreparationMaterial.role_id == role.id)
    m_count = (await db.execute(count_stmt)).scalar() or 0

    topics_list = [
        TopicRead(
            id=t.id,
            role_id=t.role_id,
            name=t.name,
            slug=t.slug,
            description=t.description,
            display_order=t.display_order,
            material_count=0,
            created_at=t.created_at,
            updated_at=t.updated_at,
        )
        for t in role.topics
    ]

    return RoleRead(
        id=role.id,
        name=role.name,
        slug=role.slug,
        description=role.description,
        icon_name=role.icon_name,
        is_active=role.is_active,
        display_order=role.display_order,
        material_count=m_count,
        topics=topics_list,
        created_at=role.created_at,
        updated_at=role.updated_at,
    )


@router.delete("/roles/{role_id}", status_code=status.HTTP_200_OK)
async def admin_delete_role(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a preparation role and associated topics and materials.
    Also cleans up associated physical files on disk.
    """
    stmt = (
        select(PreparationRole)
        .where(PreparationRole.id == role_id)
        .options(selectinload(PreparationRole.materials))
    )
    role = (await db.execute(stmt)).scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Preparation role not found.")

    # Remove physical files
    for mat in role.materials:
        try:
            p = Path(mat.file_path)
            if p.exists():
                p.unlink()
        except Exception:
            pass

    await db.delete(role)
    await db.commit()
    return {"message": f"Preparation role '{role.name}' and all associated materials deleted successfully."}


# ==============================================================================
# 2. TOPICS MANAGEMENT
# ==============================================================================

@router.post("/roles/{role_id}/topics", response_model=TopicRead, status_code=status.HTTP_201_CREATED)
async def admin_create_topic(
    role_id: uuid.UUID,
    payload: TopicCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Add a new topic under a specific preparation role.
    """
    role = (await db.execute(select(PreparationRole).where(PreparationRole.id == role_id))).scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Preparation role not found.")

    topic_slug = payload.slug or slugify(payload.name)
    topic = PreparationTopic(
        role_id=role_id,
        name=payload.name.strip(),
        slug=topic_slug,
        description=payload.description,
        display_order=payload.display_order,
    )
    db.add(topic)
    await db.commit()
    await db.refresh(topic)

    return TopicRead(
        id=topic.id,
        role_id=topic.role_id,
        name=topic.name,
        slug=topic.slug,
        description=topic.description,
        display_order=topic.display_order,
        material_count=0,
        created_at=topic.created_at,
        updated_at=topic.updated_at,
    )


@router.put("/topics/{topic_id}", response_model=TopicRead)
async def admin_update_topic(
    topic_id: uuid.UUID,
    payload: TopicUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update a topic.
    """
    topic = (await db.execute(select(PreparationTopic).where(PreparationTopic.id == topic_id))).scalars().first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found.")

    if payload.name is not None:
        topic.name = payload.name.strip()
    if payload.slug is not None:
        topic.slug = slugify(payload.slug)
    if payload.description is not None:
        topic.description = payload.description
    if payload.display_order is not None:
        topic.display_order = payload.display_order

    await db.commit()
    await db.refresh(topic)

    m_count = (
        await db.execute(
            select(func.count(PreparationMaterial.id)).where(PreparationMaterial.topic_id == topic.id)
        )
    ).scalar() or 0

    return TopicRead(
        id=topic.id,
        role_id=topic.role_id,
        name=topic.name,
        slug=topic.slug,
        description=topic.description,
        display_order=topic.display_order,
        material_count=m_count,
        created_at=topic.created_at,
        updated_at=topic.updated_at,
    )


@router.delete("/topics/{topic_id}", status_code=status.HTTP_200_OK)
async def admin_delete_topic(
    topic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a topic. Materials under this topic have topic_id set to NULL.
    """
    topic = (await db.execute(select(PreparationTopic).where(PreparationTopic.id == topic_id))).scalars().first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found.")

    await db.delete(topic)
    await db.commit()
    return {"message": f"Topic '{topic.name}' deleted successfully."}


# ==============================================================================
# 3. PDF MATERIALS MANAGEMENT (CRUD & UPLOAD)
# ==============================================================================

@router.get("/materials", response_model=List[MaterialRead])
async def admin_list_materials(
    role_id: Optional[uuid.UUID] = Query(None, description="Filter by role ID"),
    topic_id: Optional[uuid.UUID] = Query(None, description="Filter by topic ID"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    search: Optional[str] = Query(None, description="Search by title or description"),
    db: AsyncSession = Depends(get_db),
):
    """
    List all uploaded preparation materials for administrative review.
    """
    query = (
        select(PreparationMaterial)
        .options(
            selectinload(PreparationMaterial.role),
            selectinload(PreparationMaterial.topic),
        )
    )

    if role_id:
        query = query.where(PreparationMaterial.role_id == role_id)
    if topic_id:
        query = query.where(PreparationMaterial.topic_id == topic_id)
    if is_published is not None:
        query = query.where(PreparationMaterial.is_published == is_published)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.where(
            (PreparationMaterial.title.ilike(term)) | (PreparationMaterial.description.ilike(term))
        )

    query = query.order_by(PreparationMaterial.created_at.desc())
    result = await db.execute(query)
    materials = result.scalars().all()

    return [
        MaterialRead(
            id=m.id,
            role_id=m.role_id,
            role_name=m.role.name if m.role else None,
            role_slug=m.role.slug if m.role else None,
            topic_id=m.topic_id,
            topic_name=m.topic.name if m.topic else None,
            title=m.title,
            description=m.description,
            file_name=m.file_name,
            file_size_bytes=m.file_size_bytes,
            file_size_formatted=format_file_size(m.file_size_bytes),
            page_count=m.page_count,
            is_published=m.is_published,
            download_count=m.download_count,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )
        for m in materials
    ]


@router.post("/materials/upload", response_model=MaterialRead, status_code=status.HTTP_201_CREATED)
async def admin_upload_material(
    role_id: uuid.UUID = Form(...),
    topic_id: Optional[uuid.UUID] = Form(None),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    is_published: bool = Form(True),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Uploads and validates a new preparation PDF document.
    Enforces PDF magic byte validation and max 25MB file size limit.
    """
    # Verify role exists
    role = (await db.execute(select(PreparationRole).where(PreparationRole.id == role_id))).scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Target preparation role not found.")

    # Verify topic exists if provided
    topic = None
    if topic_id:
        topic = (await db.execute(select(PreparationTopic).where(PreparationTopic.id == topic_id))).scalars().first()
        if not topic:
            raise HTTPException(status_code=404, detail="Selected topic not found.")

    # Read and validate PDF file
    file_bytes = await file.read()
    is_valid, error_msg = validate_pdf_content(file_bytes)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Invalid PDF file.",
        )

    # Store file securely on disk
    upload_dir = get_upload_dir()
    disk_filename = f"{uuid.uuid4()}.pdf"
    file_disk_path = upload_dir / disk_filename
    with open(file_disk_path, "wb") as f:
        f.write(file_bytes)

    # Calculate page count
    page_count = get_pdf_page_count(file_disk_path)

    # Original filename sanitized
    orig_filename = Path(file.filename or "document.pdf").name
    if not orig_filename.lower().endswith(".pdf"):
        orig_filename = f"{orig_filename}.pdf"

    material = PreparationMaterial(
        role_id=role_id,
        topic_id=topic_id,
        title=title.strip(),
        description=description.strip() if description else None,
        file_path=str(file_disk_path.as_posix()),
        file_name=orig_filename,
        file_size_bytes=len(file_bytes),
        page_count=page_count,
        is_published=is_published,
        download_count=0,
        uploaded_by_id=current_user.id,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    return MaterialRead(
        id=material.id,
        role_id=material.role_id,
        role_name=role.name,
        role_slug=role.slug,
        topic_id=material.topic_id,
        topic_name=topic.name if topic else None,
        title=material.title,
        description=material.description,
        file_name=material.file_name,
        file_size_bytes=material.file_size_bytes,
        file_size_formatted=format_file_size(material.file_size_bytes),
        page_count=material.page_count,
        is_published=material.is_published,
        download_count=material.download_count,
        created_at=material.created_at,
        updated_at=material.updated_at,
    )


@router.put("/materials/{material_id}", response_model=MaterialRead)
async def admin_update_material(
    material_id: uuid.UUID,
    payload: MaterialUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Update metadata of an existing preparation document.
    """
    stmt = (
        select(PreparationMaterial)
        .where(PreparationMaterial.id == material_id)
        .options(
            selectinload(PreparationMaterial.role),
            selectinload(PreparationMaterial.topic),
        )
    )
    material = (await db.execute(stmt)).scalars().first()
    if not material:
        raise HTTPException(status_code=404, detail="Preparation document not found.")

    if payload.title is not None:
        material.title = payload.title.strip()
    if payload.description is not None:
        material.description = payload.description.strip() if payload.description else None
    if payload.topic_id is not None:
        material.topic_id = payload.topic_id
    if payload.is_published is not None:
        material.is_published = payload.is_published

    await db.commit()
    await db.refresh(material)

    # Re-fetch topic if changed
    topic_name = material.topic.name if material.topic else None
    if payload.topic_id is not None and payload.topic_id:
        topic_obj = (
            await db.execute(select(PreparationTopic).where(PreparationTopic.id == payload.topic_id))
        ).scalars().first()
        if topic_obj:
            topic_name = topic_obj.name

    return MaterialRead(
        id=material.id,
        role_id=material.role_id,
        role_name=material.role.name if material.role else None,
        role_slug=material.role.slug if material.role else None,
        topic_id=material.topic_id,
        topic_name=topic_name,
        title=material.title,
        description=material.description,
        file_name=material.file_name,
        file_size_bytes=material.file_size_bytes,
        file_size_formatted=format_file_size(material.file_size_bytes),
        page_count=material.page_count,
        is_published=material.is_published,
        download_count=material.download_count,
        created_at=material.created_at,
        updated_at=material.updated_at,
    )


@router.post("/materials/{material_id}/replace", response_model=MaterialRead)
async def admin_replace_material_pdf(
    material_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Replaces the underlying PDF file for an existing material record.
    """
    stmt = (
        select(PreparationMaterial)
        .where(PreparationMaterial.id == material_id)
        .options(
            selectinload(PreparationMaterial.role),
            selectinload(PreparationMaterial.topic),
        )
    )
    material = (await db.execute(stmt)).scalars().first()
    if not material:
        raise HTTPException(status_code=404, detail="Preparation document not found.")

    file_bytes = await file.read()
    is_valid, error_msg = validate_pdf_content(file_bytes)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Invalid PDF file.",
        )

    # Remove old file if it exists
    try:
        old_path = Path(material.file_path)
        if old_path.exists():
            old_path.unlink()
    except Exception:
        pass

    # Save new file
    upload_dir = get_upload_dir()
    disk_filename = f"{uuid.uuid4()}.pdf"
    file_disk_path = upload_dir / disk_filename
    with open(file_disk_path, "wb") as f:
        f.write(file_bytes)

    page_count = get_pdf_page_count(file_disk_path)
    orig_filename = Path(file.filename or "document.pdf").name
    if not orig_filename.lower().endswith(".pdf"):
        orig_filename = f"{orig_filename}.pdf"

    material.file_path = str(file_disk_path.as_posix())
    material.file_name = orig_filename
    material.file_size_bytes = len(file_bytes)
    material.page_count = page_count

    await db.commit()
    await db.refresh(material)

    return MaterialRead(
        id=material.id,
        role_id=material.role_id,
        role_name=material.role.name if material.role else None,
        role_slug=material.role.slug if material.role else None,
        topic_id=material.topic_id,
        topic_name=material.topic.name if material.topic else None,
        title=material.title,
        description=material.description,
        file_name=material.file_name,
        file_size_bytes=material.file_size_bytes,
        file_size_formatted=format_file_size(material.file_size_bytes),
        page_count=material.page_count,
        is_published=material.is_published,
        download_count=material.download_count,
        created_at=material.created_at,
        updated_at=material.updated_at,
    )


@router.delete("/materials/{material_id}", status_code=status.HTTP_200_OK)
async def admin_delete_material(
    material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Deletes a preparation material and removes the PDF file from server disk.
    """
    stmt = select(PreparationMaterial).where(PreparationMaterial.id == material_id)
    material = (await db.execute(stmt)).scalars().first()
    if not material:
        raise HTTPException(status_code=404, detail="Preparation document not found.")

    try:
        p = Path(material.file_path)
        if p.exists():
            p.unlink()
    except Exception:
        pass

    await db.delete(material)
    await db.commit()
    return {"message": f"Document '{material.title}' deleted successfully."}

