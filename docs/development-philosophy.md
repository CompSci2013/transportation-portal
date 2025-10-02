# Analysis of Halo Labs Development Philosophy

After reading the infra-docs, here's what I understand about application development and software installation policies at Halo Labs:

## Core Development Principles

### 1. **Minimal Server Footprint Policy**
From the infrastructure-overview.md:
> "Operational Policy #1: **Minimal Server Footprint:** No direct package installations on host servers - use containers"

This is the fundamental principle. Development and applications run **inside containers**, not directly on Thor or Loki.

### 2. **Container-First Development**
- **Build on Thor** using Podman (Thor has Podman installed for this purpose)
- **Export and import to K3s** containerd for deployment
- **Deploy to Kubernetes** with proper namespace organization
- Docker is **not installed** on either node - Podman is the build tool

### 3. **Development Workflow Pattern**
From the technical achievements document, the established pattern is:

```
1. Develop locally (in container or via Remote-SSH)
2. Build container image with Podman on Thor
3. Export: podman save image:tag -o image.tar
4. Import to K3s: sudo k3s ctr images import image.tar
5. Deploy to Kubernetes with proper manifests
```

### 4. **Storage for Persistent Data**
- **Thor:** `/mnt/data/*` for application data, models, databases
- **Loki:** `/srv/*` for service persistence
- **Never install directly on root partitions** - use PVCs or bind mounts

## Where Software Installations Go

### ❌ **NOT Allowed:**
- Direct package installation on host OS (apt install, yum install, etc.)
- Installing development tools directly on Thor/Loki
- Running applications as systemd services (except infrastructure like Ollama)

### ✅ **Allowed/Expected:**
- **Containerized applications** in Kubernetes namespaces
- **Development containers** with volume mounts to `/home/odin/projects/`
- **VS Code Remote-SSH** from Windows workstation
- **Podman on Thor** for building images only

## Namespace Organization for Apps

From the capabilities document:
- `apps` - User-facing applications (like Angular Dockview)
- `data` - Data services (Elasticsearch, databases)
- `llm` - AI/ML workloads
- Custom namespaces for specific projects (like `tle` for satellite tracker)

## Transportation Portal Implications

For our Transportation Portal project:

1. **Backend API (Node.js):**
   - Build in container on Thor
   - Deploy to `apps` or new `transportation` namespace
   - Connect to Elasticsearch platform service in `data` namespace

2. **Frontend (Angular):**
   - Build multi-stage Dockerfile (like TLE tracker did)
   - nginx serves static files in production
   - Deploy alongside backend in same namespace

3. **Development:**
   - Use VS Code Remote-SSH to Thor
   - Work in `/home/odin/projects/transportation/`
   - Run `ng serve` and `npm run dev` in **development containers** if needed
   - Or connect directly via Remote-SSH for lighter development

4. **No Host Installation:**
   - Don't `apt install nodejs` on Thor
   - Don't `apt install nginx` on Thor
   - Everything runs in containers managed by Kubernetes

## Key Insight

The ETL pipeline already follows this pattern perfectly - it runs in a **Podman container** with volume mounts. Our web application should follow the same philosophy:
- Containerized backend and frontend
- Deployed to Kubernetes
- No software installed directly on hosts
- Clean separation between build environment (Podman) and runtime (K3s)

---

