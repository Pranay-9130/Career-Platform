/**
 * Schema.org JSON-LD Structured Data Generators for Student Career Platform
 */

const BASE_URL = "https://studentcareer.dev";

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AspirePath",
    "alternateName": "AspirePath",
    "url": BASE_URL,
    "description": "From your first project to your first job. Discover open-source student projects, craft ATS-optimized resumes, analyze scores with Gemini AI, and land entry-level tech roles.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/projects?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AspirePath",
    "url": BASE_URL,
    "logo": `${BASE_URL}/logo.png`,
    "description": "Connecting university students and self-taught developers with impactful project showcases and hiring tech companies.",
    "sameAs": [
      "https://github.com/studentcareer",
      "https://twitter.com/studentcareer",
      "https://linkedin.com/company/studentcareer"
    ]
  };
}

export function getBreadcrumbListSchema(crumbs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.path ? `${BASE_URL}${crumb.path}` : BASE_URL
    }))
  };
}

export function getJobPostingSchema(job) {
  if (!job) return null;

  const validThrough = job.deadline
    ? new Date(job.deadline).toISOString()
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const isRemote = job.work_mode?.toLowerCase() === "remote";

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description || `${job.title} at ${job.company_name}`,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.company_name,
      "value": job.id
    },
    "datePosted": job.created_at ? new Date(job.created_at).toISOString() : new Date().toISOString(),
    "validThrough": validThrough,
    "employmentType": job.job_type === "Internship" ? "INTERN" : (job.job_type === "Part-time" ? "PART_TIME" : "FULL_TIME"),
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company_name,
      "sameAs": job.company_website || undefined,
      "logo": job.company_logo_url || undefined
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location || "San Francisco",
        "addressRegion": "CA",
        "addressCountry": "US"
      }
    },
    ...(isRemote
      ? {
          "jobLocationType": "TELECOMMUTE",
          "applicantLocationRequirements": {
            "@type": "Country",
            "name": "United States"
          }
        }
      : {}),
    "baseSalary": job.stipend_or_salary
      ? {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": {
            "@type": "QuantitativeValue",
            "unitText": "YEAR",
            "value": job.stipend_or_salary
          }
        }
      : undefined,
    "skills": Array.isArray(job.skills_required) ? job.skills_required.join(", ") : job.skills_required,
    "directApply": Boolean(job.apply_url)
  };
}

export function getProjectCreativeWorkSchema(project) {
  if (!project) return null;

  let createdDate = new Date().toISOString();
  if (project.created_at) {
    const parsed = new Date(project.created_at);
    if (!isNaN(parsed.getTime())) {
      createdDate = parsed.toISOString();
    }
  }

  const techLanguage = Array.isArray(project.tech_stack)
    ? project.tech_stack.join(", ")
    : (typeof project.tech_stack === "string" ? project.tech_stack : "Full Stack");

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "name": project.title || "Project Blueprint",
    "description": project.short_description || project.problem_statement || project.title || "Student Engineering Project",
    "url": `${BASE_URL}/projects/${project.slug || ""}`,
    "programmingLanguage": techLanguage,
    "codeRepository": project.github_url || undefined,
    "author": {
      "@type": "Person",
      "name": project.author_name || project.owner?.full_name || "Student Developer"
    },
    "dateCreated": createdDate,
    "applicationCategory": project.domain || "DeveloperApplication"
  };
}

export function getSoftwareApplicationSchema(name, description, path) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": name,
    "description": description,
    "url": `${BASE_URL}${path}`,
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };
}
