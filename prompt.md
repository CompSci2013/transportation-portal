# Transportation Portal Project - Session Resume Prompt

## Project Context
You are assisting with the development of a **Transportation Data Portal** web application at **Halo Labs**, a self-hosted Kubernetes infrastructure. The project involves building a full-stack application to search and visualize transportation data (planes, trains, automobiles) stored in Elasticsearch.

## Current Project State

### What's Been Completed
1. **ETL Pipeline (100% Complete)**
   - Location: `/home/odin/projects/transportation/etl/` on Thor node
   - Python-based pipeline with Pydantic models
   - Successfully loaded 4,607 aircraft records into Elasticsearch
   - Full FAA dataset (~300,000 records) downloaded and ready
   - Container: `transport-etl-dev` running in Podman

2. **Data Verification (Completed)**
   - Elasticsearch cluster confirmed healthy (green status)
   - Index `transport-unified` exists with 4,607 documents
   - Sample queries successful, data structure validated
   - Elasticsearch accessible at `http://thor:30398`

3. **Project Structure Created**
   - Backend directory structure created: `~/projects/transportation/backend/src/{config,middleware,routes,controllers,services,models,utils}`
   - Frontend planning documents exist in `~/projects/transportation/core/services/`
   - Documentation in `~/projects/transportation/docs/`

### What's Next (Immediate Task)
**Initialize the Node.js backend project** by running `npm init -y` in the backend directory, then install core dependencies.

## Infrastructure Context (Halo Labs)

### Critical Policies
1. **Minimal Server Footprint**: NO direct package installations on host servers - everything runs in containers
2. **Container-First Development**: Build with Podman on Thor, deploy to K3s
3. **Storage Locations**:
   - Thor: `/mnt/data/*` for application data
   - Loki: `/srv/*` for service persistence
   - Projects: `/home/odin/projects/`

### Available Infrastructure
- **Kubernetes**: K3s cluster (Loki: control-plane, Thor: worker with GPU)
- **Elasticsearch**: Platform service at `http://thor:30398` in `data` namespace
- **Container Runtime**: Podman (build) → K3s containerd (deploy)
- **Development**: VS Code Remote-SSH from Windows workstation to Thor
- **Internal Domain**: `*.minilab` (DNS via `/etc/hosts`)

### Image Management Workflow
```bash
# Build with Podman on Thor
podman build -t <image>:<tag> .

# Export
podman save <image>:<tag> -o <image>.tar

# Import to K3s
sudo k3s ctr images import <image>.tar

# Deploy with imagePullPolicy: Never
```

## Technical Stack

### Backend (Node.js/Express)
- Framework: Express.js
- Database Client: @elastic/elasticsearch
- Authentication: JWT (jsonwebtoken)
- Dependencies: cors, dotenv, bcryptjs
- Port: 3000

### Frontend (Angular 13)
- Framework: Angular 13 with routing
- Styling: SCSS
- State Management: Services in `core/services/`
- Port: 4200 (dev), 80 (production via nginx)

### Deployment Architecture
```
Browser → Traefik Ingress (transportation.minilab)
         ↓
    ┌────────────┴────────────┐
    ↓                         ↓
Angular Frontend      Node.js API
(nginx container)     (Express container)
Port: 80              Port: 3000
    ↓
Elasticsearch Service
(thor:30398)
```

## Directory Structure Reference
```
/home/odin/projects/transportation/
├── backend/              # Node.js API (partially created)
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   └── tests/
├── frontend/            # Angular 13 app (to be created)
├── core/                # Existing Angular services
│   └── services/
├── etl/                 # Complete Python ETL pipeline
└── docs/                # Project documentation
    └── dev-guide.txt    # Comprehensive setup guide
```

## Key Files Attached
- `dev-guide.txt`: Complete development and deployment guide
- `create_indices.py`: Elasticsearch index creation
- `faa_transformer.py`: ETL transformation logic
- `elasticsearch_loader.py`: Data loading implementation
- ETL models: `common.py`, `planes.py`, `automobiles.py`
- Infrastructure docs: Master document, capabilities, technical achievements

## Assistant Instructions

### Response Format (CRITICAL)
For each instruction you provide:
1. **State the server** (Thor or Loki)
2. **Change directory first** (`cd ~/projects/transportation/...`)
3. **Provide the command**
4. **Explain what it does** (including flag meanings)
5. **Preview next steps**

### Development Approach
- Follow containerized development principles
- Build on Thor, deploy to K3s
- Use namespace `transportation` or `apps`
- Connect backend to existing Elasticsearch service
- Reference TLE Satellite Tracker as implementation example

### Current Session Goal
Create the Node.js backend API that:
- Connects to Elasticsearch at `http://thor:30398`
- Provides REST endpoints for searching transportation data
- Implements JWT authentication
- Follows Express.js best practices
- Runs in a container (not directly on host)

## Resume Point
**Last completed action**: Created backend directory structure with all subdirectories.

**Next action**: Run `npm init -y` in the backend directory to initialize the Node.js project, then install core dependencies (Express, Elasticsearch client, JWT libraries, etc.).

**Context**: User asked for sanity check on Elasticsearch data (completed successfully), then we created the backend directory structure. User is ready to continue with backend initialization.
