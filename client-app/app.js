// ==========================================
// QuarkShield VPN Client - Application Logic
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements Cache ---
  const tabButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  const vpnToggleBtn = document.getElementById('vpn-toggle-btn');
  const statusDisplayText = document.getElementById('status-display-text');
  const topStatusPill = document.getElementById('top-status-pill');
  const sidebarSecurityBadge = document.getElementById('sidebar-security-badge');
  const networkCipherTag = document.getElementById('network-cipher-tag');
  
  // Metrics
  const metricIp = document.getElementById('metric-ip');
  const metricLatency = document.getElementById('metric-latency');
  const metricBytes = document.getElementById('metric-bytes');
  
  // Params Table
  const paramKem = document.getElementById('param-kem');
  const paramClassical = document.getElementById('param-classical');
  const paramSig = document.getElementById('param-sig');
  const paramSymmetric = document.getElementById('param-symmetric');
  
  // Controls
  const kemSelect = document.getElementById('kem-select');
  const sigSelect = document.getElementById('sig-select');
  const cipherSelect = document.getElementById('cipher-select');
  const cryptoWarningBanner = document.getElementById('crypto-warning-banner');
  
  // Logs
  const consoleLogs = document.getElementById('console-logs');
  const clearConsoleBtn = document.getElementById('clear-console-btn');
  
  // Exporter
  const exporterTabs = document.querySelectorAll('.exporter-tab');
  const configCodeBox = document.getElementById('config-code-box');
  const copyConfigBtn = document.getElementById('copy-config-btn');
  
  // Diagnostics
  const diagPqName = document.getElementById('diag-pq-name');
  const diagPqBar = document.getElementById('diag-pq-bar');
  const diagPqVal = document.getElementById('diag-pq-val');
  const diagTimeVal = document.getElementById('diag-time-val');

  // Network Panel (for adding layout class)
  const panelNetwork = document.querySelector('.panel-network');

  // Terms Modal elements (QuarkShield LLC)
  const termsModal = document.getElementById('terms-modal');
  const acceptCheckbox = document.getElementById('accept-checkbox');
  const acceptTermsBtn = document.getElementById('accept-terms-btn');
  const declineTermsBtn = document.getElementById('decline-terms-btn');

  // --- State Variables ---
  let isConnected = false;
  let isConnecting = false;
  let handshakeTimer = null;
  let byteTransferInterval = null;
  let bytesTransferred = 0;
  let currentExporterTab = 'client'; // 'client' or 'server'
  let selectedDownloadPlatform = null;

  // Cryptographic algorithms lookup database
  const cryptoDetails = {
    // Hybrid ciphers
    'x25519_kyber768': {
      kem: 'ML-KEM-768 (Kyber)',
      classical: 'ECDH X25519',
      sig: 'ML-DSA-65 (Dilithium3)',
      isQuantumSafe: true,
      keySize: 1184,
      handshakeTime: '2.1 ms',
      handshakeTimeVal: 2.1,
      securityLevel: 'AES-192 Equivalent (NIST Category 3)'
    },
    'p256_kyber768': {
      kem: 'ML-KEM-768 (Kyber)',
      classical: 'ECDH P-256',
      sig: 'ML-DSA-65 (Dilithium3)',
      isQuantumSafe: true,
      keySize: 1184,
      handshakeTime: '2.4 ms',
      handshakeTimeVal: 2.4,
      securityLevel: 'AES-192 Equivalent (NIST Category 3)'
    },
    'p384_kyber1024': {
      kem: 'ML-KEM-1024 (Kyber)',
      classical: 'ECDH P-384',
      sig: 'ML-DSA-87 (Dilithium5)',
      isQuantumSafe: true,
      keySize: 1568,
      handshakeTime: '3.8 ms',
      handshakeTimeVal: 3.8,
      securityLevel: 'AES-256 Equivalent (NIST Category 5)'
    },
    'frodo976_aes': {
      kem: 'FrodoKEM-976-AES',
      classical: 'ECDH X25519',
      sig: 'ML-DSA-65 (Dilithium3)',
      isQuantumSafe: true,
      keySize: 15616,
      handshakeTime: '12.6 ms',
      handshakeTimeVal: 12.6,
      securityLevel: 'AES-256 Equivalent (NIST Category 5)'
    },
    // Classical ciphers
    'x25519_only': {
      kem: 'None (Classical Key Exchange)',
      classical: 'ECDH X25519',
      sig: 'ECDSA P-256',
      isQuantumSafe: false,
      keySize: 32,
      handshakeTime: '0.8 ms',
      handshakeTimeVal: 0.8,
      securityLevel: 'Vulnerable to Shor\'s Algorithm (Quantum Breakable)'
    },
    'p256_only': {
      kem: 'None (Classical Key Exchange)',
      classical: 'ECDH P-256',
      sig: 'ECDSA P-256',
      isQuantumSafe: false,
      keySize: 64,
      handshakeTime: '0.9 ms',
      handshakeTimeVal: 0.9,
      securityLevel: 'Vulnerable to Shor\'s Algorithm (Quantum Breakable)'
    },
    'rsa3072_dh': {
      kem: 'None (Classical Key Exchange)',
      classical: 'Diffie-Hellman (3072-bit)',
      sig: 'RSA-3072',
      isQuantumSafe: false,
      keySize: 384,
      handshakeTime: '5.2 ms',
      handshakeTimeVal: 5.2,
      securityLevel: 'Vulnerable to Shor\'s Algorithm (Quantum Breakable)'
    }
  };

  // --- 1. Tab Navigation Routing ---
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Set active to clicked tab
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });

  // --- 2. Cryptographic Settings Sync ---
  function updateCryptoSettings() {
    const selectedSuite = kemSelect.value;
    const details = cryptoDetails[selectedSuite];
    
    // Automatically match signature selections if possible
    if (details.isQuantumSafe) {
      if (selectedSuite === 'p384_kyber1024') {
        sigSelect.value = 'mldsa87';
      } else {
        sigSelect.value = 'mldsa65';
      }
      cryptoWarningBanner.classList.add('hidden');
      sidebarSecurityBadge.className = 'security-status-indicator safe';
      sidebarSecurityBadge.querySelector('.text').textContent = 'Quantum Safe';
      sidebarSecurityBadge.querySelector('.icon').textContent = '🔒';
    } else {
      sigSelect.value = selectedSuite === 'rsa3072_dh' ? 'rsa4096' : 'ecdsa';
      cryptoWarningBanner.classList.remove('hidden');
      sidebarSecurityBadge.className = 'security-status-indicator vulnerable';
      sidebarSecurityBadge.querySelector('.text').textContent = 'Vulnerable Node';
      sidebarSecurityBadge.querySelector('.icon').textContent = '⚠️';
    }

    // Sync parameters display table
    paramKem.textContent = details.kem;
    paramClassical.textContent = details.classical;
    paramSig.value = sigSelect.value;
    
    // Force CSS highlight updates
    if (details.isQuantumSafe) {
      paramKem.className = 'pqc-highlight';
      paramSig.className = 'pqc-highlight';
    } else {
      paramKem.className = '';
      paramSig.className = '';
    }

    // Sync Diagnostic Graphs
    diagPqName.textContent = details.isQuantumSafe ? details.kem : 'Legacy Key Exchange';
    
    // Calculate size bar relative width (max is FrodoKEM at 15.6KB, Kyber is 1.1KB, ECDH is 32B)
    let sizePercentage = 5;
    if (details.keySize > 15000) {
      sizePercentage = 95;
    } else if (details.keySize > 1000) {
      sizePercentage = 35;
    } else if (details.keySize > 100) {
      sizePercentage = 15;
    }
    
    diagPqBar.style.width = `${sizePercentage}%`;
    diagPqVal.textContent = details.keySize.toLocaleString() + ' Bytes';
    diagTimeVal.textContent = details.handshakeTime;

    // Redraw configuration templates
    renderConfigTemplates();
  }

  kemSelect.addEventListener('change', updateCryptoSettings);
  sigSelect.addEventListener('change', () => {
    const details = cryptoDetails[kemSelect.value];
    paramSig.textContent = sigSelect.options[sigSelect.selectedIndex].text;
    if (sigSelect.value.startsWith('mldsa')) {
      paramSig.className = 'pqc-highlight';
    } else {
      paramSig.className = '';
    }
    renderConfigTemplates();
  });
  
  cipherSelect.addEventListener('change', () => {
    paramSymmetric.textContent = cipherSelect.options[cipherSelect.selectedIndex].text;
    renderConfigTemplates();
  });

  // --- 3. Handshake Emulator State Machine ---
  function addConsoleLog(text, type = 'info') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    line.innerHTML = `<span style="color: var(--text-muted)">[${timestamp}]</span> ${text}`;
    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
  }

  clearConsoleBtn.addEventListener('click', () => {
    consoleLogs.innerHTML = '';
    addConsoleLog('Console cleared. Daemon idle.', 'system');
  });

  function initiateVPNHandshake() {
    if (isConnected || isConnecting) return;
    
    isConnecting = true;
    vpnToggleBtn.className = 'power-btn connecting';
    topStatusPill.className = 'connection-pill status-connecting';
    topStatusPill.querySelector('.pill-text').textContent = 'Connecting...';
    statusDisplayText.textContent = 'Negotiating Cryptographic Handshake...';
    
    // Reset Metrics
    metricIp.textContent = '- - -';
    metricLatency.textContent = '- - -';
    metricBytes.textContent = '0 KB';
    bytesTransferred = 0;
    
    const suite = kemSelect.value;
    const details = cryptoDetails[suite];
    const signatureAlg = sigSelect.value;
    const symmetricAlg = cipherSelect.options[cipherSelect.selectedIndex].text;

    // Logging connection sequences
    addConsoleLog(`[VPN-Daemon] Launching tunnel socket binding...`, 'info');
    addConsoleLog(`[VPN-Daemon] Connecting to gateway vpn.quarkshield.services:1194`, 'info');
    
    let step = 0;
    const handshakeSteps = [
      // Step 1: Client Hello
      () => {
        addConsoleLog(`[OQS-TLS] CLIENT HELLO transmitted. Protocol: TLSv1.3.`, 'info');
        if (details.isQuantumSafe) {
          addConsoleLog(`[PQC] Ephemeral Hybrid Groups offered: ${details.classical} + ${details.kem}`, 'pqc');
          addConsoleLog(`[PQC] Key Encapsulation Public Key sent: ${details.keySize} bytes`, 'pqc');
        } else {
          addConsoleLog(`[OQS-TLS] Ephemeral Groups offered: ${details.classical}`, 'warning');
          addConsoleLog(`[OQS-TLS] WARNING: No post-quantum key encapsulation offered. Connection vulnerable to decryption!`, 'error');
        }
      },
      // Step 2: Server Response & KEM Encapsulation
      () => {
        addConsoleLog(`[OQS-TLS] SERVER HELLO received. Cipher chosen: TLS_AES_256_GCM_SHA384`, 'info');
        if (details.isQuantumSafe) {
          addConsoleLog(`[PQC] Server accepted Key Exchange: ${details.classical} + ${details.kem}`, 'pqc');
          addConsoleLog(`[PQC] Received server encapsulated shared secret ciphertext (1088 bytes)`, 'pqc');
        }
        
        // Certificate check
        addConsoleLog(`[OQS-TLS] Validating gateway certificate chain...`, 'info');
        if (signatureAlg.startsWith('mldsa')) {
          addConsoleLog(`[PQC] Gateway certificate signature verified using ${signatureAlg.toUpperCase()} signature`, 'pqc');
        } else {
          addConsoleLog(`[OQS-TLS] Gateway certificate verified using legacy ${signatureAlg.toUpperCase()}`, 'warning');
        }
      },
      // Step 3: Key Derivation
      () => {
        addConsoleLog(`[OQS-TLS] Deriving session secrets...`, 'info');
        if (details.isQuantumSafe) {
          addConsoleLog(`[PQC] Hybrid Secret computed: KDF(${details.classical}_Secret || ${details.kem}_Secret)`, 'pqc');
        } else {
          addConsoleLog(`[OQS-TLS] Secret computed: KDF(${details.classical}_Secret)`, 'warning');
        }
        addConsoleLog(`[OQS-TLS] Session Key derived for symmetric tunnel encryption: ${symmetricAlg}`, 'success');
      },
      // Step 4: Session Active
      () => {
        isConnecting = false;
        isConnected = true;
        
        vpnToggleBtn.className = 'power-btn connected';
        topStatusPill.className = 'connection-pill status-connected';
        topStatusPill.querySelector('.pill-text').textContent = 'Secure';
        statusDisplayText.textContent = 'Tunnel Established • Connected';
        
        // Show Virtual IP and stats
        metricIp.textContent = '10.8.0.6';
        metricLatency.textContent = details.handshakeTime;
        
        // Enable animations
        if (details.isQuantumSafe) {
          panelNetwork.className = 'glass-card panel-network connected-visual';
          networkCipherTag.className = 'cipher-tag visible';
          networkCipherTag.textContent = details.classical.split(' ')[1] + '_' + details.kem.split(' ')[0].toLowerCase().replace('-', '');
        } else {
          panelNetwork.className = 'glass-card panel-network connected-visual-vulnerable';
          networkCipherTag.className = 'cipher-tag visible vulnerable-suite';
          networkCipherTag.textContent = 'LEGACY: ' + details.classical.split(' ')[1];
        }

        addConsoleLog(`[VPN-Daemon] TUN interface 'tun0' initialized. MTU=1500`, 'info');
        addConsoleLog(`[VPN-Daemon] Secure tunnel route successfully injected. Traffic encapsulated.`, 'success');
        addConsoleLog(`[VPN-Daemon] CONNECTION SECURED AGAINST QUANTUM COMPILING ATTACKS.`, 'success');
        
        // Start simulated byte counter
        byteTransferInterval = setInterval(() => {
          bytesTransferred += Math.floor(Math.random() * 85) + 15; // random additions
          if (bytesTransferred > 1024) {
            metricBytes.textContent = (bytesTransferred / 1024).toFixed(1) + ' MB';
          } else {
            metricBytes.textContent = bytesTransferred + ' KB';
          }
        }, 1000);
      }
    ];

    function runNextStep() {
      if (step < handshakeSteps.length) {
        handshakeSteps[step]();
        step++;
        // Speed up classical steps, slow down PQC slightly to show complexity
        const delay = details.isQuantumSafe ? 700 : 400;
        handshakeTimer = setTimeout(runNextStep, delay);
      }
    }

    runNextStep();
  }

  function disconnectVPN() {
    if (isConnecting) {
      clearTimeout(handshakeTimer);
      isConnecting = false;
      addConsoleLog(`[VPN-Daemon] Connection establishment aborted by user.`, 'error');
    }
    
    isConnected = false;
    clearInterval(byteTransferInterval);
    
    vpnToggleBtn.className = 'power-btn';
    topStatusPill.className = 'connection-pill status-disconnected';
    topStatusPill.querySelector('.pill-text').textContent = 'Disconnected';
    statusDisplayText.textContent = 'Click to Establish Quantum-Safe Tunnel';
    
    // Clear Metrics
    metricIp.textContent = '- - -';
    metricLatency.textContent = '- - -';
    metricBytes.textContent = '0 KB';
    
    // Clear Visual classes
    panelNetwork.className = 'glass-card panel-network';
    networkCipherTag.className = 'cipher-tag';
    
    addConsoleLog(`[VPN-Daemon] Closing tunnel socket...`, 'info');
    addConsoleLog(`[VPN-Daemon] Interface tun0 destroyed. IP routing table restored.`, 'info');
    addConsoleLog(`[VPN-Daemon] VPN Disconnected. System offline.`, 'system');
  }

  vpnToggleBtn.addEventListener('click', () => {
    if (isConnected || isConnecting) {
      disconnectVPN();
    } else {
      initiateVPNHandshake();
    }
  });

  // --- 4. VPN Configuration Profile Compiler ---
  function renderConfigTemplates() {
    const suite = kemSelect.value;
    const signature = sigSelect.value;
    const symm = cipherSelect.value === 'aes256' ? 'AES-256-GCM' : 'CHACHA20-POLY1305';
    
    // Construct algorithm variable names for OQS-OpenVPN format
    let tlsGroup = 'x25519_kyber768';
    if (suite === 'p256_kyber768') tlsGroup = 'p256_kyber768';
    else if (suite === 'p384_kyber1024') tlsGroup = 'p384_kyber1024';
    else if (suite === 'frodo976_aes') tlsGroup = 'x25519_frodo976aes';
    else if (suite === 'x25519_only') tlsGroup = 'X25519';
    else if (suite === 'p256_only') tlsGroup = 'P-256';
    else if (suite === 'rsa3072_dh') tlsGroup = 'DH';

    if (currentExporterTab === 'client') {
      configCodeBox.textContent = `# ===================================================
# QuarkShield Quantum-Safe VPN client.conf
# ===================================================
client
dev tun
proto udp
remote vpn.quarkshield.services 1194

resolv-retry infinite
nobind
persist-key
persist-tun

# Certificates and keys signed with post-quantum signatures
ca certs/ca.crt
cert certs/client.crt
key certs/client.key
remote-cert-tls server

# Cryptographic Protocols
tls-version-min 1.3
tls-groups ${tlsGroup}
tls-ciphersuites TLS_${symm === 'AES-256-GCM' ? 'AES_256_GCM_SHA384' : 'CHACHA20_POLY1305_SHA256'}

# Symmetric Encryption
cipher ${symm}
auth SHA256
compress lz4-v2
verb 3`;
    } else {
      configCodeBox.textContent = `# ===================================================
# QuarkShield Quantum-Safe VPN server.conf
# ===================================================
port 1194
proto udp
dev tun

# Keypair configuration (ML-DSA-65 / Dilithium3)
ca /etc/openvpn/certs/ca.crt
cert /etc/openvpn/certs/server.crt
key /etc/openvpn/certs/server.key
dh none

# Addressing subnet
server 10.8.0.0 255.255.255.0
topology subnet
ifconfig-pool-persist ipp.txt

# Hybrid Key Exchange parameters (OQS enabled)
tls-groups ${tlsGroup}
tls-version-min 1.3
tls-ciphersuites TLS_${symm === 'AES-256-GCM' ? 'AES_256_GCM_SHA384' : 'CHACHA20_POLY1305_SHA256'}

# Symmetric Cryptography parameters
cipher ${symm}
auth SHA256
keepalive 10 120
persist-key
persist-tun

# Pushed settings to node clients
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 1.1.1.1"

# Logs
status /var/log/openvpn/openvpn-status.log
log /var/log/openvpn/openvpn.log
verb 3`;
    }
  }

  // Bind Config Exporter Tabs
  exporterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      exporterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentExporterTab = tab.getAttribute('data-exp');
      renderConfigTemplates();
    });
  });

  // Copy Config handler
  copyConfigBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(configCodeBox.textContent)
      .then(() => {
        const originalText = copyConfigBtn.textContent;
        copyConfigBtn.textContent = '✓ Copied!';
        copyConfigBtn.style.borderColor = 'var(--accent-green)';
        copyConfigBtn.style.color = 'var(--accent-green)';
        setTimeout(() => {
          copyConfigBtn.textContent = originalText;
          copyConfigBtn.style.borderColor = '';
          copyConfigBtn.style.color = '';
        }, 2000);
      })
      .catch(err => {
        alert('Failed to copy config: ' + err);
      });
  });

  // --- 5. Terms & License Modal Handlers ---
  window.showDownloadTerms = (platform) => {
    selectedDownloadPlatform = platform;
    acceptCheckbox.checked = false;
    acceptTermsBtn.classList.add('disabled');
    acceptTermsBtn.disabled = true;
    termsModal.classList.remove('hidden');
  };

  acceptCheckbox.addEventListener('change', () => {
    if (acceptCheckbox.checked) {
      acceptTermsBtn.classList.remove('disabled');
      acceptTermsBtn.disabled = false;
    } else {
      acceptTermsBtn.classList.add('disabled');
      acceptTermsBtn.disabled = true;
    }
  });

  declineTermsBtn.addEventListener('click', () => {
    termsModal.classList.add('hidden');
    selectedDownloadPlatform = null;
  });

  acceptTermsBtn.addEventListener('click', () => {
    if (!acceptTermsBtn.disabled && selectedDownloadPlatform) {
      termsModal.classList.add('hidden');
      alert(`QUARKSHIELD LLC - SECURE DOWNLOAD INITIATED\n\nPackage: QuarkShield VPN Client for ${selectedDownloadPlatform} (v2.4.0)\n\nCompatibility verified. The installation file is compliant with standard Windows (MSI) / macOS (DMG) architecture. Starting your secure download...`);
      selectedDownloadPlatform = null;
    }
  });

  // Initialize
  updateCryptoSettings();
});
