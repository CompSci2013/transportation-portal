# Transportation Portal - Post-Reboot Recovery Guide

**Last Updated:** 2025-10-04  
**Environment:** Halo Labs K3s Cluster (Loki + Thor)

---

## Step 1: Verify Kubernetes Cluster Health

**Check cluster nodes are ready:**
```bash
kubectl get nodes
```

**Expected output:**
```
NAME   STATUS   ROLES                  AGE   VERSION
loki   Ready    control-plane,master   XXd   v1.33.3+k3s1
thor   Ready    <none>                 XXd   v1.33.4+k3s1
```

**✓ Success criteria:** Both nodes show `STATUS: Ready`

---

## Step 2: Check Backend API (Kubernetes Deployment)

**Check all resources in transportation namespace:**
```bash
kubectl get pods,svc,ingress -n transportation
```

**Expected output:**
```
NAME                                READY   STATUS    RESTARTS   AGE
pod/transport-api-XXXXXXXXX-XXXXX   1/1     Running   X          XXh
pod/transport-api-XXXXXXXXX-XXXXX   1/1     Running   X          XXh

NAME                    TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/transport-api   ClusterIP   10.43.XXX.XXX   <none>        3000/TCP   XXh

NAME                                      CLASS     HOSTS                   ADDRESS                     PORTS   AGE
ingress.networking.k8s.io/transport-api   traefik   transportation.minilab   192.168.0.110,192.168.0.244   80      XXh
```

**✓ Success criteria:**
- 2 API pods showing `READY: 1/1` and `STATUS: Running`
- Service `transport-api` exists
- Ingress exists with host `transportation.minilab`

**If pods aren't running:**
```bash
# Check pod details
kubectl describe pod <pod-name> -n transportation

# Check pod logs
kubectl logs <pod-name> -n transportation
```

---

## Step 3: Check Frontend Dev Container (Podman)

**Check if dev container exists and is running:**
```bash
podman ps -a | grep transport-frontend-dev
```

**Expected output:**
```
CONTAINER ID  IMAGE                             COMMAND           CREATED        STATUS        PORTS  NAMES
XXXXXXXXXXXX  localhost/transport-frontend:dev  tail -f /dev/null XX minutes ago Up XX minutes         transport-frontend-dev
```

**✓ Success criteria:** Container shows `STATUS: Up`

**If container is NOT running (Exited):**
```bash
# Start the stopped container
podman start transport-frontend-dev
```

**If container doesn't exist:**
```bash
# Create and run new container
podman run -it --rm \
  --name transport-frontend-dev \
  --network host \
  -v /home/odin/projects/transportation/frontend/transport-portal:/app:z \
  localhost/transport-frontend:dev
```

---

## Step 4: Start Angular Development Server

**Access the running container:**
```bash
podman exec -it transport-frontend-dev sh
```

**Inside the container, start the dev server:**
```bash
cd /app
ng serve --host 0.0.0.0 --port 4200
```

**✓ Success criteria:** You see output like:
```
✔ Browser application bundle generation complete.
Initial Chunk Files | Names         |  Raw Size
...
✔ Compiled successfully.
** Angular Live Development Server is listening on 0.0.0.0:4200 **
```

**Note:** Leave this terminal running. The dev server must stay active.

---

## Step 5: Verify Services via Browser

Open these URLs in your Windows browser:

### Backend API Endpoints (Production - Kubernetes)

**1. API Info endpoint:**
```
http://transportation.minilab/api/v1/info
```
**Expected:** JSON response with API version/status

**2. Manufacturer-State combinations:**
```
http://transportation.minilab/api/v1/manufacturer-state-combinations
```
**Expected:** JSON array of manufacturer/state combinations

**3. Specific aircraft lookup:**
```
http://transportation.minilab/api/v1/aircraft/plane-N102VA
```
**Expected:** JSON object with aircraft details

### Frontend (Development - Podman)

**4. Angular application:**
```
http://192.168.0.244:4200
```
**Expected:** Transportation Portal homepage with search interface

**5. Search page:**
```
http://192.168.0.244:4200/search
```
**Expected:** Aircraft search page with filters and results table

---

## Step 6: Verify Data Layer

**Check Elasticsearch is accessible:**
```bash
curl http://thor:30398/_cluster/health?pretty
```

**Expected output:**
```json
{
  "cluster_name" : "...",
  "status" : "green" or "yellow",
  "number_of_nodes" : X,
  ...
}
```

**Check transport data exists:**
```bash
curl http://thor:30398/transport-unified/_count?pretty
```

**Expected:** Count of documents in the index

---

## Quick Troubleshooting

### Backend API not responding

```bash
# Check API pod logs
kubectl logs -f deployment/transport-api -n transportation

# Restart API deployment
kubectl rollout restart deployment/transport-api -n transportation
```

### Frontend not loading (Connection Refused)

```bash
# Verify container is running
podman ps | grep transport-frontend-dev

# If running, check if ng serve is active
podman exec -it transport-frontend-dev ps aux | grep ng

# If ng serve not running, exec into container and start it
podman exec -it transport-frontend-dev sh
cd /app && ng serve --host 0.0.0.0 --port 4200
```

### Ingress not routing correctly

```bash
# Check Traefik is running
kubectl get pods -n kube-system | grep traefik

# Describe ingress for details
kubectl describe ingress transport-api -n transportation
```

---

## Summary Checklist

After reboot, verify in this order:

- [ ] K3s nodes ready: `kubectl get nodes`
- [ ] Backend pods running: `kubectl get pods -n transportation`
- [ ] Backend API accessible: `http://transportation.minilab/api/v1/info`
- [ ] Frontend container running: `podman ps | grep transport-frontend-dev`
- [ ] Angular dev server started: `podman exec` → `ng serve`
- [ ] Frontend accessible: `http://192.168.0.244:4200`
- [ ] Elasticsearch healthy: `curl http://thor:30398/_cluster/health?pretty`

**All green? You're ready to develop!**

---

## URLs Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend (Dev) | http://192.168.0.244:4200 | Angular development server |
| Backend API | http://transportation.minilab/api/v1/* | REST API endpoints |
| Elasticsearch | http://thor:30398 | Data store (internal) |
| GitLab | http://gitlab.minilab | Source control |

---

*Save this file as: `~/projects/transportation/docs/POST-REBOOT-CHECKLIST.md`*
