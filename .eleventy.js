module.exports = (eleventy) => {
  eleventy.addPassthroughCopy({ "public": "/" });
  eleventy.addPassthroughCopy({ "admin": "/admin" });

  eleventy.addShortcode("year", () => new Date().getFullYear());

  // Encode &, <, > but leave quotes raw — matches the existing HTML's
  // character handling (which uses &amp; and &lt; but raw apostrophes).
  eleventy.addFilter("h", (input) => {
    if (input === null || input === undefined) return "";
    return String(input)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  });

  // Date formatting filter for blog posts
  eleventy.addFilter("dateFormat", (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  });

  // Markdown excerpt filter — first paragraph
  eleventy.addFilter("excerpt", (content) => {
    if (!content) return "";
    const stripped = content.replace(/<[^>]+>/g, "");
    return stripped.substring(0, 160) + (stripped.length > 160 ? "…" : "");
  });

  // Blog collection — markdown files in src/blog/
  eleventy.addCollection("blog", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/blog/*.md").sort((a, b) => {
      return (b.data.date || 0) - (a.data.date || 0);
    });
  });

  // Designs collection — markdown files in src/designs/
  eleventy.addCollection("designs", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/designs/*.md").sort((a, b) => {
      return (b.data.downloads || 0) - (a.data.downloads || 0);
    });
  });

  // MCPs collection — markdown files in src/mcps/
  eleventy.addCollection("mcps", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/mcps/*.md").sort((a, b) => {
      return (b.data.installs || 0) - (a.data.installs || 0);
    });
  });

  eleventy.setNunjucksEnvironmentOptions({ autoescape: false });

  return {
    dir: {
      input: "src",
      includes: "../_includes",
      data: "../content",
      output: "_site",
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
