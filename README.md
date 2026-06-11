# QuarkShield: Standalone Quantum-Safe VPN

This repository contains a standalone corporate VPN deployment design utilizing Open Quantum Safe (OQS) OpenVPN and hybrid post-quantum key encapsulation to safeguard network tunnels against **Harvest-Now-Decrypt-Later (HNDL)** attacks.

---

## 🏗️ System Architecture

Traditional VPN client-server handshakes rely on ECDH, DH, or RSA for key negotiation. These algorithms are broken by Shor's algorithm on a sufficiently large quantum computer. QuarkShield VPN replaces/supplements this layer by integrating NIST-standardized Post-Quantum Cryptography (PQC).

```text
                                  [ VPN HANDSHAKE PHASE ]
                                  Negotiates: ECDH + ML-KEM
                                             |
   User Laptop  =======================> Internet =======================> VPN Gateway ====> Corp Net
 (Client Node)     Encrypted Data Tunnel (AES-256-GCM / ChaCha20)        (OQS-OpenVPN)    (10.0.0.0/8)
```

1. **User Laptop (Client)**: Runs a PQC-aware OpenVPN client configured with hybrid key exchange templates.
2. **VPN Gateway (Docker Server)**: An isolated OQS OpenVPN node hosting post-quantum certificate authorities and verifying connections.
3. **Key Exchange (Hybrid)**: Combines classical **ECDH (X25519)** with **ML-KEM-768** (NIST Category 3, Kyber768). If the post-quantum implementation is compromised, the classical ECDH still protects the data; if classical is broken by a quantum computer, the ML-KEM layer secures the session.

---

## 📂 Project Structure

```text
quantum-safe-vpn/
├── docker-compose.yml         # Gateway Docker compose container configurations
├── LICENSE.txt                # QuarkShield LLC Software License Agreement
├── setup_gateway.sh           # Auto-provisions gate certificates and PKI variables
├── setup_client.sh            # Packages client profiles and generates client keys
├── USER_INSTALL_GUIDE.md      # Client Installation & User Guide for Windows/macOS
├── templates/
│   ├── server.conf            # Gateway daemon configuration template
│   └── client.conf            # User client configuration template
├── client-app/                # Interactive VPN Client GUI (Web Simulation)
│   ├── index.html             # Client GUI window markup
│   ├── style.css              # Glassmorphic cyberpunk styling & hop animations
│   └── app.js                 # Handshake sequence simulation state logic
└── README.md                  # System documentation and manuals
```

---

## ⚡ Quick Start Deployment

### 1. Initialize the Gateway Keys
Run the gateway provisioning script to build the PKI certificates folder and import configuration profiles:
```bash
./setup_gateway.sh
```

### 2. Boot the VPN Server Gateway
Launch the OQS OpenVPN server container using Docker Compose:
```bash
docker-compose up -d
```
*Verify the logs to ensure the container is listening on UDP port 1194:*
```bash
docker logs -f quantum-safe-vpn-gateway
```

### 3. Generate User Client Profile
On the client management machine, generate client profiles and certificates:
```bash
./setup_client.sh
```
This will compile the client config files inside `client/client.ovpn` using certificates signed with **ML-DSA-65** (Post-Quantum signatures).

---

## 💻 Running the Client App Dashboard

An interactive, premium single-page web dashboard is provided to demonstrate the client's handshake negotiation step-by-step.

1. Navigate to the `client-app/` folder.
2. Open `index.html` in your web browser (you can double-click it or run a local file server).
3. **Features to Explore**:
   - **Connection Control**: Click the power button to view an animated sequence simulating the hybrid TLS 1.3 handshake negotiation (transmitting key encapsulations, validating PQC certificates, and deriving HKDF keys).
   - **Cipher settings dropdown**: Switch from Hybrid (e.g. `ECDH + ML-KEM-768`) to Legacy Classical-only configurations (e.g. `ECDH X25519 Only`) to trigger vulnerability banners.
   - **Diagnostics**: View public key size benchmarks (showing the ~37x size payload difference between classical and PQC keys) and execution time differences.
   - **Config Exporters & Downloads**: Copy active `.conf` client/server parameters or simulate client OS package downloads.

---

## 🔒 Post-Quantum Cryptography Technical Reference

| Cryptographic Phase | Classical Protocol | Quantum-Safe Alternative | NIST Standard Status |
|---|---|---|---|
| **Key Exchange (KEM)** | ECDH X25519 / DH | **ML-KEM-768** (Kyber) | Standardized (FIPS 203) |
| **Authentication (Signature)** | RSA-3072 / ECDSA | **ML-DSA-65** (Dilithium) | Standardized (FIPS 204) |
| **Symmetric Cipher** | AES-256-GCM | **AES-256-GCM** (Remains Safe) | Standardized |

### Why Hybrid?
To protect against initial implementation vulnerabilities in new PQC math, **FIPS 203** key exchanges are combined in hybrid mode. For example, `x25519_kyber768` runs both key exchanges in parallel. The resulting shared secret is:
$$\text{SharedSecret} = \text{HKDF}(\text{ECDH\_secret} \mathbin{\Vert} \text{Kyber\_secret})$$
This ensures decryption is impossible unless *both* algorithms are broken.

---

## ❓ Frequently Asked Questions (FAQ)

### 1. Which corporate subnet range does this VPN route to?
By default, the gateway is configured to allocate IP addresses within the **`10.8.0.0/24`** subnet for active VPN clients. It pushes routing tables to client devices redirecting traffic designated for the corporate network range (configured as **`10.0.0.0/8`** in template routing paths) through the tunnel.

### 2. Do I need to configure my browser or client tools to access internal sources?
**No.** The VPN client operates at the system level. When you toggle the connection, it registers a virtual network interface (`tun0` on macOS or a `Wintun` interface on Windows) and injects the routing table directly into your operating system kernel. Packets heading to any internal IP (e.g. `10.150.1.20`) are automatically routed and encrypted through the tunnel transparently.

### 3. Is the compiled desktop client GUI a simulator or a real client?
The desktop GUI application (`QuarkShieldVPN.app`) acts as a **high-fidelity interactive simulator** for training, configuration testing, and performance auditing. To establish a **real network socket tunnel** to your running Hetzner server (`5.161.249.16`), you execute the OQS OpenVPN client launcher via the terminal or inside Docker as documented in the Quick Start section.

### 4. What are the installation requirements for macOS and Windows?
*   **macOS**: Requires double-clicking the DMG, dragging to Applications, and clicking **Allow** on the macOS prompt to authorize the Network Extension API configurations.
*   **Windows**: Requires running the MSI installer and clicking **Install/Trust** when Windows Security requests permission to register the secure **Wintun virtual adapter driver**.

