---
trigger: always_on
---

# Modern Web Development Rules for LLMs

## Core Principles

- **Semantic HTML first** - Use the right HTML element for the job (`<nav>`, `<article>`, `<section>`, `<button>` vs `<div>`). This improves accessibility, SEO, and maintainability.

- **Mobile-first responsive design** - Start with mobile layouts and progressively enhance for larger screens. Use relative units (rem, em, %) over fixed pixels.

- **Component thinking** - Break interfaces into reusable, self-contained components with clear responsibilities. Each component should do one thing well.

- **Accessibility by default** - Include proper ARIA labels, semantic HTML, keyboard navigation, sufficient color contrast, and focus states. Never sacrifice accessibility for aesthetics.

- **Progressive enhancement** - Build a working baseline experience, then layer on JavaScript enhancements. The site should function (even if limited) without JS.

## Styling & Layout

- **Modern CSS layouts** - Use Flexbox for one-dimensional layouts and CSS Grid for two-dimensional layouts. Avoid float-based layouts.

- **CSS custom properties** - Use CSS variables for theming, consistency, and easy maintenance (colors, spacing scales, typography).

- **Utility-first when appropriate** - Tailwind-style utilities can speed development, but maintain semantic class names for complex components.

- **Consistent spacing scale** - Use a systematic spacing system (4px, 8px, 16px, 24px, 32px, etc.) rather than arbitrary values.

## JavaScript

- **Vanilla JS first** - Don't reach for frameworks for simple tasks. Modern JavaScript is powerful enough for most interactions.

- **Minimal dependencies** - Each dependency is a liability. Question whether you really need that library.

- **Async/await over callbacks** - Use modern async patterns for cleaner, more readable code.

- **Event delegation** - Attach listeners to parent elements when handling many similar elements.

## Performance

- **Lazy load images** - Use native `loading="lazy"` for images below the fold.

- **Minimize layout shifts** - Specify width/height for images and reserve space for dynamic content to maintain good Core Web Vitals.

- **Optimize assets** - Compress images, minify CSS/JS, use modern formats (WebP, AVIF).

- **Critical CSS inline** - Inline above-the-fold CSS to eliminate render-blocking.

## Code Quality

- **Consistent naming** - Use clear, descriptive names. Follow conventions (BEM, camelCase, kebab-case) consistently.

- **DRY but not over-abstracted** - Avoid repetition, but don't create abstractions prematurely. Three uses is a good threshold.

- **Comments for why, not what** - Code should be self-explanatory; comments explain decisions and context.

- **Small, focused functions** - Each function should have a single, clear purpose.

## Modern Patterns

- **CSS Grid over frameworks** - For layouts, modern CSS often eliminates the need for Bootstrap/Foundation.

- **Native form validation** - Use HTML5 validation attributes before reaching for JavaScript.

- **CSS containment** - Use `contain` property for performance in component-heavy applications.

- **Container queries over media queries** - When browser support allows, container queries create more resilient components.

## Security

- **Sanitize user input** - Never trust client-side data. Validate and sanitize everything.

- **Content Security Policy** - Implement CSP headers to prevent XSS attacks.

- **HTTPS everywhere** - No exceptions for production sites.

## Development Workflow

- **Version control everything** - Clear, atomic commits with descriptive messages.

- **Linting and formatting** - Enforce code style automatically (ESLint, Prettier).

- **Test interactively** - Test across browsers, devices, screen readers, and keyboard-only navigation.

---