# CML2 Bulk Admin Controller

A high-performance, professional dashboard for managing Cisco Modeling Labs (CML2) at scale. Optimized for university environments, lab instructors, and network administrators.

![Dashboard Preview](https://raw.githubusercontent.com/kakalpa/CML_Bulk_Admin/main/preview.png)

## 🚀 Key Features

### 👤 Student Sync (Bulk User Management)
- **CSV Import:** Provision hundreds of students in seconds using simple CSV files.
- **Bulk Lifecycle:** Create, update passwords, and delete student accounts in batches.
- **Status Monitoring:** Real-time feedback on API success/failure for every user operation.

### 🔬 Lab Lifecycle & Resource Guard
- **Power Control:** Start, Stop, Wipe, or Delete labs in bulk across the entire controller.
- **Resource Impact Preview:** Calculates the estimated vCPU and RAM impact before you start a batch of labs to prevent controller crashes.

### 🛡️ Group Manager
- **Class Organization:** Create and manage student groups for project-based access.
- **Bulk Assignment:** Link students to specific class groups to simplify permission management.

### 📊 System Health & Monitoring
- **Host Metrics:** Real-time monitoring of the CML physical host's CPU, RAM, and Disk usage.
- **Resource Allocation:** Detailed breakdown of allocated vs. available resources across all compute hosts.

### 👻 Orphaned Labs Cleanup
- **Zombie Lab Detection:** Automatically finds labs owned by users who have been deleted.
- **One-Click Cleanup:** Reclaim system resources by purging ghost topologies.

### 🕵️ API Monitor
- **Live Logs:** Transparent view of every REST API call made to the CML controller.
- **Troubleshooting:** Monitor status codes, response times, and payloads for debugging.

## 🛠️ Technology Stack
- **Frontend:** React + Vite + TailwindCSS
- **State Management:** Zustand (with Persistence)
- **Icons:** Lucide React
- **API:** Axios with Interceptors
- **Containerization:** Docker + Nginx

## 📦 Quick Start with Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kakalpa/CML_Bulk_Admin.git
   cd CML_Bulk_Admin
   ```

2. **Deploy using the provided script:**
   ```bash
   ./docker-deploy.sh
   ```

3. **Access the Dashboard:**
   Open [http://localhost:8080](http://localhost:8080) in your browser.

## ⚙️ Configuration

The dashboard connects to your CML instance via a secure proxy. 
- Edit `nginx.conf` to update your CML Controller's IP address if it changes.
- Default Proxy: `https://172.16.50.128`

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.
