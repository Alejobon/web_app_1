"""Service layer — business/orchestration rules.

Each service owns cross-entity coordination and business logic for one entity.
Routers call services; services call repositories. Repositories only persist.
"""
