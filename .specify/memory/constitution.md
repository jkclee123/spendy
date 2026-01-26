<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (initial ratification)

Added principles:
- I. Code Quality & Type Safety
- II. Testing Standards
- III. User Experience Consistency
- IV. Performance Requirements
- V. Simplicity & Maintainability

Added sections:
- Performance Standards
- Development Workflow
- Governance

Templates reviewed:
- ✅ plan-template.md - "Constitution Check" section aligns with principles
- ✅ spec-template.md - User stories and success criteria support UX/testing principles
- ✅ tasks-template.md - Test-first workflow and user story organization align with principles

Follow-up TODOs: None
-->

# Spendy Constitution

## Core Principles

### I. Code Quality & Type Safety

All code MUST be written with explicit TypeScript types. Implicit `any` is forbidden.

- **Type definitions**: Every function parameter, return value, and variable MUST have explicit types
- **No type assertions**: Avoid `as` casts unless absolutely necessary with documented justification
- **Strict mode**: TypeScript strict mode MUST be enabled (`"strict": true` in tsconfig)
- **Linting enforcement**: ESLint MUST run on all code with zero warnings policy
- **Consistent formatting**: Prettier MUST be configured and enforced via pre-commit hooks

**Rationale**: Type safety prevents runtime errors, improves IDE support, and makes refactoring safer.

### II. Testing Standards

All user-facing features MUST have corresponding tests. Test coverage is required for critical paths.

- **Contract tests**: API endpoints (`/api/*`) MUST have contract tests validating request/response schemas
- **Integration tests**: User journeys (login → action → verification) MUST have integration tests
- **Component tests**: React components with business logic MUST have unit tests
- **Test isolation**: Each test MUST be independent and not rely on execution order
- **Test naming**: Test descriptions MUST follow "should [expected behavior] when [condition]" format

**Rationale**: Tests document expected behavior and catch regressions before users encounter them.

### III. User Experience Consistency

The application MUST provide a consistent, accessible experience across all devices.

- **Mobile-first design**: All layouts MUST be designed for mobile first, then enhanced for larger screens
- **Responsive breakpoints**: Use Tailwind's standard breakpoints (sm, md, lg, xl) consistently
- **Touch targets**: Interactive elements MUST be at least 44x44px on mobile
- **Loading states**: Every async operation MUST show a loading indicator
- **Error handling**: User-facing errors MUST display actionable messages, never raw error text
- **Accessibility**: All interactive elements MUST be keyboard navigable with proper ARIA labels

**Rationale**: Consistent UX builds user trust and reduces support burden.

### IV. Performance Requirements

The application MUST meet specific performance thresholds for optimal user experience.

- **Largest Contentful Paint (LCP)**: MUST be under 2.5 seconds on 4G connection
- **First Input Delay (FID)**: MUST be under 100 milliseconds
- **Cumulative Layout Shift (CLS)**: MUST be under 0.1
- **Bundle size**: JavaScript bundle MUST be under 200KB gzipped for initial load
- **API response time**: Backend endpoints MUST respond in under 500ms at p95
- **Offline capability**: Core PWA features MUST function offline with service worker caching

**Rationale**: Performance directly impacts user retention and satisfaction on mobile devices.

### V. Simplicity & Maintainability

Prefer simple, straightforward solutions over clever abstractions.

- **YAGNI principle**: Do not build features until they are actually needed
- **Single responsibility**: Each file/function SHOULD do one thing well
- **Dependency minimization**: New dependencies MUST be justified in PR descriptions
- **No premature optimization**: Profile before optimizing; comments MUST explain non-obvious optimizations
- **Documentation**: Complex logic MUST have inline comments explaining the "why"

**Rationale**: Simple code is easier to understand, test, debug, and maintain over time.

## Performance Standards

Specific performance budgets for the Spendy PWA:

| Metric | Target | Maximum |
|--------|--------|---------|
| Time to Interactive | < 3s | 5s |
| Initial JS Bundle | < 150KB | 200KB |
| API Response (p50) | < 200ms | 300ms |
| API Response (p95) | < 400ms | 500ms |
| Image Assets | WebP/AVIF | No unoptimized PNGs |
| Database Queries | < 50ms | 100ms |

**Measurement**: Performance MUST be validated using Lighthouse CI on every deployment.

## Development Workflow

Standards for consistent development practices:

- **Commit messages**: Follow Conventional Commits format (`feat:`, `fix:`, `docs:`, `refactor:`, etc.)
- **Branch naming**: Use `feature/`, `fix/`, `chore/` prefixes (e.g., `feature/add-stats-page`)
- **PR requirements**: All PRs MUST pass CI checks (lint, type-check, tests) before merge
- **Code review**: All changes MUST be reviewed by at least one other developer
- **Environment variables**: Secrets MUST never be committed; use `.env.local` and document in `.env.example`

## Governance

This constitution establishes the foundational principles for Spendy development.

- **Precedence**: Constitution principles supersede all other development practices
- **Amendments**: Changes require documented justification and version increment
- **Compliance**: All PRs and code reviews MUST verify adherence to these principles
- **Exceptions**: Deviations MUST be documented in the "Complexity Tracking" section of the implementation plan

**Version**: 1.0.0 | **Ratified**: 2026-01-26 | **Last Amended**: 2026-01-26
