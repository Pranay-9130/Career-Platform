import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.placement_preparation import (
    PreparationRole,
    PreparationTopic,
    PreparationMaterial,
)
from app.schemas.placement_preparation import (
    RoleRead,
    TopicRead,
    MaterialRead,
)
from app.services.placement_prep_service import format_file_size

router = APIRouter(prefix="/placement-preparation", tags=["Placement Preparation"])


@router.get("/roles", response_model=List[RoleRead])
async def list_preparation_roles(
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves all active placement preparation roles along with their topics
    and the count of currently published PDF documents.
    """
    stmt = (
        select(PreparationRole)
        .where(PreparationRole.is_active == True)
        .options(selectinload(PreparationRole.topics))
        .order_by(PreparationRole.display_order.asc(), PreparationRole.name.asc())
    )
    result = await db.execute(stmt)
    roles = result.scalars().all()

    # Get published materials count per role and per topic
    count_stmt = (
        select(PreparationMaterial.role_id, func.count(PreparationMaterial.id))
        .where(PreparationMaterial.is_published == True)
        .group_by(PreparationMaterial.role_id)
    )
    count_res = await db.execute(count_stmt)
    role_counts = dict(count_res.all())

    topic_count_stmt = (
        select(PreparationMaterial.topic_id, func.count(PreparationMaterial.id))
        .where(and_(PreparationMaterial.is_published == True, PreparationMaterial.topic_id.isnot(None)))
        .group_by(PreparationMaterial.topic_id)
    )
    t_count_res = await db.execute(topic_count_stmt)
    topic_counts = dict(t_count_res.all())

    output = []
    for r in roles:
        role_topics = []
        for t in r.topics:
            role_topics.append(
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
            )

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


@router.get("/roles/{slug}", response_model=RoleRead)
async def get_preparation_role_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves a single preparation role by slug, including its topic categories.
    """
    stmt = (
        select(PreparationRole)
        .where(and_(PreparationRole.slug == slug.lower().strip(), PreparationRole.is_active == True))
        .options(selectinload(PreparationRole.topics))
    )
    result = await db.execute(stmt)
    role = result.scalars().first()

    if not role:
        raise HTTPException(status_code=404, detail="Preparation role not found.")

    # Role materials count
    count_stmt = (
        select(func.count(PreparationMaterial.id))
        .where(and_(PreparationMaterial.role_id == role.id, PreparationMaterial.is_published == True))
    )
    material_count = (await db.execute(count_stmt)).scalar() or 0

    # Topic counts
    topic_count_stmt = (
        select(PreparationMaterial.topic_id, func.count(PreparationMaterial.id))
        .where(and_(PreparationMaterial.role_id == role.id, PreparationMaterial.is_published == True))
        .group_by(PreparationMaterial.topic_id)
    )
    t_counts = dict((await db.execute(topic_count_stmt)).all())

    topics_list = [
        TopicRead(
            id=t.id,
            role_id=t.role_id,
            name=t.name,
            slug=t.slug,
            description=t.description,
            display_order=t.display_order,
            material_count=t_counts.get(t.id, 0),
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
        material_count=material_count,
        topics=topics_list,
        created_at=role.created_at,
        updated_at=role.updated_at,
    )


@router.get("/roles/{slug}/materials", response_model=List[MaterialRead])
async def list_role_materials(
    slug: str,
    topic_id: Optional[uuid.UUID] = Query(None, description="Filter by topic ID"),
    search: Optional[str] = Query(None, description="Search by title or description"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves published preparation PDFs for a specific role with optional topic and search filters.
    """
    role_stmt = select(PreparationRole).where(
        and_(PreparationRole.slug == slug.lower().strip(), PreparationRole.is_active == True)
    )
    role = (await db.execute(role_stmt)).scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Preparation role not found.")

    query = (
        select(PreparationMaterial)
        .where(
            and_(
                PreparationMaterial.role_id == role.id,
                PreparationMaterial.is_published == True,
            )
        )
        .options(selectinload(PreparationMaterial.topic))
    )

    if topic_id:
        query = query.where(PreparationMaterial.topic_id == topic_id)

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
            role_name=role.name,
            role_slug=role.slug,
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


@router.get("/materials/{material_id}/preview")
async def preview_material_pdf(
    material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Streams the PDF document inline for the in-app embedded PDF viewer.
    """
    stmt = select(PreparationMaterial).where(PreparationMaterial.id == material_id)
    material = (await db.execute(stmt)).scalars().first()

    if not material:
        raise HTTPException(status_code=404, detail="Preparation document not found.")

    file_path = Path(material.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file content not found on server storage.")

    safe_filename = material.file_name.replace('"', '\\"')
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{safe_filename}"',
            "Cache-Control": "public, max-age=3600",
        },
    )


@router.get("/materials/{material_id}/download")
async def download_material_pdf(
    material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Downloads the PDF document as an attachment and increments the download count.
    """
    stmt = select(PreparationMaterial).where(PreparationMaterial.id == material_id)
    material = (await db.execute(stmt)).scalars().first()

    if not material:
        raise HTTPException(status_code=404, detail="Preparation document not found.")

    file_path = Path(material.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF file content not found on server storage.")

    material.download_count = (material.download_count or 0) + 1
    await db.commit()

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=material.file_name,
    )

