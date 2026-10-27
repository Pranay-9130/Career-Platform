import { useEffect } from "react";

const BASE_URL = "https://aspirepath.vercel.app";
const DEFAULT_TITLE = "AspirePath — Your Journey. Your Skills. Your Future.";
const DEFAULT_DESCRIPTION =
  "Discover student projects, showcase your work, build an ATS-compliant resume, analyze match scores with Gemini AI, and find verified tech opportunities.";
const DEFAULT_IMAGE = `${BASE_URL}/og-preview.png`;

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_IMAGE,
  schema = null,
}) {
  useEffect(() => {
    // 1. Title
    const formattedTitle = title
      ? title.includes("AspirePath")
        ? title
        : `${title} | AspirePath`
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper to set/update meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Helper to set/update link tag
    const setLinkTag = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // 2. Standard Meta
    setMetaTag("name", "description", description);

    // 3. Canonical URL
    const canonicalUrl = canonical
      ? canonical.startsWith("http")
        ? canonical
        : `${BASE_URL}${canonical}`
      : window.location.href;
    setLinkTag("canonical", canonicalUrl);

    // 4. Open Graph Tags
    setMetaTag("property", "og:title", formattedTitle);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("property", "og:site_name", "AspirePath");

    // 5. Twitter Card Tags
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", formattedTitle);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", ogImage);

    // 6. JSON-LD Structured Data
    const existingScript = document.getElementById("json-ld-seo");
    if (existingScript) {
      existingScript.remove();
    }

    if (schema) {
      const script = document.createElement("script");
      script.id = "json-ld-seo";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      // Optional cleanup on unmount
      const s = document.getElementById("json-ld-seo");
      if (s) s.remove();
    };
  }, [title, description, canonical, ogType, ogImage, schema]);

  return null;
}
