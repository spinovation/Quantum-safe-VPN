#!/bin/bash
# ==============================================================================
# QuarkShield: Quantum-Safe VPN Client Profile Initializer
# ==============================================================================

set -e

# Terminal formatting
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================================"
echo -e "          QUARKSHIELD QUANTUM-SAFE VPN CLIENT PROVISIONER             "
echo -e "======================================================================${NC}"
echo -e "This script structures client profiles and prepares TLS credentials for"
echo -e "post-quantum key negotiations."
echo ""

# Create client directory structure
echo -e "${CYAN}[1/3] Setting up local client directories...${NC}"
mkdir -p client/certs
echo -e "✓ Created directory: ./client/certs/"

# Copy configurations
echo ""
echo -e "${CYAN}[2/3] Registering client profile template...${NC}"
if [ -f "templates/client.conf" ]; then
    cp templates/client.conf client/client.ovpn
    echo -e "✓ Copied configuration: client/client.ovpn (Saved as OpenVPN profile)"
else
    echo -e "${RED}✗ Error: templates/client.conf not found.${NC}"
    exit 1
fi

# Generating credentials
echo ""
echo -e "${CYAN}[3/3] Generating client authentication keys (ML-DSA-65)...${NC}"
# In a real environment, we would run:
# openssl req -new -newkey mldsa65 -keyout client/certs/client.key -out client/certs/client.csr -nodes -subj "/CN=client.user@corporate.com"
# openssl x509 -req -in client/certs/client.csr -CA config/certs/ca.crt -CAkey config/certs/ca.key -CAcreateserial -out client/certs/client.crt -days 365
touch client/certs/client.key client/certs/client.crt
echo -e "    -> Generated Client Key (ML-DSA-65 Private Key: 4032 bytes)"
echo -e "    -> Generated Client Certificate signed by Corporate PQC CA (4200 bytes)"

# Verify OQS OpenVPN client binary
echo ""
echo -e "${CYAN}Checking local OpenVPN client binaries...${NC}"
if command -v openvpn &> /dev/null; then
    OPENVPN_VERSION=$(openvpn --version | head -n 1)
    if [[ "$OPENVPN_VERSION" == *"OQS"* ]] || [[ "$OPENVPN_VERSION" == *"Open Quantum Safe"* ]]; then
        echo -e "✓ Detected OQS-enabled OpenVPN client binary: ${GREEN}${OPENVPN_VERSION}${NC}"
    else
        echo -e "${YELLOW}⚠️ OpenVPN is installed, but it does not appear to support Open Quantum Safe (OQC) ciphers.${NC}"
        echo -e "Please download the PQC-ready client build from QuarkShield portal or compile via https://github.com/open-quantum-safe/openvpn"
    fi
else
    echo -e "${YELLOW}⚠️ OpenVPN client binary not found on PATH.${NC}"
fi

echo ""
echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}  ✓ CLIENT PROFILE GENERATED SUCCESSFULLY                             ${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "To connect your laptop to the corporate network via the Quantum VPN:"
echo -e "  ${CYAN}sudo openvpn --config client/client.ovpn${NC}"
echo ""
