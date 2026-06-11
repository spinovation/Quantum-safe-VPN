# QuarkShield Quantum-Safe VPN Client: Installation & User Guide

Welcome to the **QuarkShield Quantum-Safe VPN Client**. This guide walks end-users through the download, installation, and first-time connection procedure on **Windows** and **macOS** laptops.

---

## 📋 System Requirements & Prerequisites

Before beginning, ensure your device meets the following specifications:
*   **Operating Systems**:
    *   **macOS**: macOS 12 (Monterey) or newer (Intel or Apple Silicon).
    *   **Windows**: Windows 10 or Windows 11 (64-bit x64 or ARM64).
*   **Permissions**: Local Administrator privileges are required during installation to register the virtual network adapters and security frameworks.
*   **Profile Package**: You must obtain your secure client configuration files (`client.ovpn`, `ca.crt`, `client.crt`, and `client.key`) from your IT Security Administrator.

---

## 📥 Step 1: Downloading the Client Installer

1.  Navigate to your corporate QuarkShield portal page in your web browser (e.g., `https://vpn.quarkshield.services` or your allocated customer gateway address).
2.  Click on the **Downloads** or **Diagnostics** tab.
3.  Click the download card matching your operating system:
    *   🍎 **macOS Client Installer** (`QuarkShield-VPN-Client-v2.4.0.dmg`)
    *   🪟 **Windows Client Installer** (`QuarkShield-VPN-Client-v2.4.0.msi`)
4.  A **QuarkShield LLC End User License Agreement** modal will appear. Review the terms, check the **"I accept the terms and conditions"** box, and click **Accept & Download** to start the download.

---

## 🍎 Step 2A: macOS Installation Procedure

1.  Locate the downloaded `QuarkShield-VPN-Client-v2.4.0.dmg` file in your Downloads folder and double-click to mount it.
2.  In the installer window, drag the **QuarkShield VPN** icon into your **Applications** folder.
3.  Open your **Applications** folder and double-click **QuarkShield VPN** to launch the client for the first time.
4.  **Network Extension Permission (Crucial)**:
    *   During launch, macOS will present a system prompt:
        > *"QuarkShield VPN" would like to add VPN configurations.*
    *   Click **Allow**. This authorizes the client to interface with the macOS Network Extension framework to encrypt system-level network traffic.
5.  **Import Configuration**:
    *   In the client interface, click the **Cipher Settings** or **Import** tab.
    *   Click **Select Profile** and load the `client.ovpn` configuration file provided by your administrator.
6.  **Establish connection**:
    *   Return to the main screen and toggle the **Power/Connection Switch** to initiate the tunnel.

---

## 🪟 Step 2B: Windows Installation Procedure

1.  Locate the downloaded `QuarkShield-VPN-Client-v2.4.0.msi` file and double-click to launch the setup wizard.
2.  On the Welcome screen, click **Next**.
3.  Review the End User License Agreement from **QuarkShield LLC**, check **"I accept the terms in the License Agreement"**, and click **Next**.
4.  Choose the installation folder (default is recommended) and click **Next**.
5.  Click **Install**. A User Account Control (UAC) prompt will request system access. Click **Yes**.
6.  **Network Adapter Driver Prompt (Crucial)**:
    *   During setup, the installer registers the secure **Wintun virtual network adapter**.
    *   If Windows Defender or Windows Security presents a prompt asking:
        > *Do you want to install this device software: QuarkShield Network Adapters?*
    *   Click **Install** / **Trust**. (If you skip this, the client will fail to route traffic through the virtual interface).
7.  Once the setup finishes, click **Finish**.
8.  Launch the **QuarkShield VPN** client from your desktop shortcut or Windows Start Menu.
9.  **Import Configuration**:
    *   Drag and drop your `client.ovpn` configuration profile directly into the application window, or click **Import** to browse and select it.
10. **Establish connection**:
    *   Click the central **VPN Toggle Switch** to initiate the tunnel.

---

## 🔒 Step 3: Verifying Your Quantum-Safe Connection

Once the connection switch glows **Green (Secure)**, you can verify that the tunnel is active and quantum-safe:

1.  **IP Address Check**: The client dashboard will display your **Virtual IP Address** (e.g. `10.8.0.6`).
2.  **Cryptographic Logs**:
    *   In the lower console panel, review the handshake logs.
    *   Ensure you see the following log line verifying PQC key encapsulation:
        ```text
        [PQC] Ephemeral Hybrid Groups negotiated: ECDH X25519 + ML-KEM-768
        [PQC] Gateway certificate signature verified using ML-DSA-65
        ```
3.  **Active Overhead Diagnostics**:
    *   Go to the **Diagnostics** tab.
    *   The bar charts will display your active key size (e.g. `1,184 Bytes` for ML-KEM-768) and the handshake time overhead (e.g. `2.1 ms`), illustrating how your connection is protected against "Harvest Now, Decrypt Later" decryption attacks.
