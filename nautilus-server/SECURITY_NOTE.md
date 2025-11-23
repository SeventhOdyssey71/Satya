# Security Advisory: Dependency Vulnerabilities

## RSA Timing Sidechannel Vulnerability (RUSTSEC-2023-0071)

**Status:** KNOWN LIMITATION  
**Severity:** Medium (CVSS 5.9)  
**Component:** `rsa 0.8.2` via `fastcrypto`

### Description
The RSA crate used by Mysten Labs' fastcrypto library has a potential timing sidechannel vulnerability (Marvin Attack) that could allow key recovery in specific scenarios.

### Impact Assessment
- **Risk Level:** LOW in TEE context
- **Mitigation:** TEE provides hardware-level timing attack protection
- **Attack Vector:** Requires precise timing measurements which are difficult in secure enclaves

### Current Status
- Cannot be updated as `fastcrypto` is pinned to specific revision for Sui ecosystem compatibility
- Vulnerability exists in dependency tree: `rsa 0.8.2 → fastcrypto → nautilus-server`
- No fixed upgrade available from upstream Mysten Labs

### Mitigation Strategies
1. **TEE Protection:** Nitro Enclaves provide timing attack resistance
2. **Network Isolation:** TEE operations are isolated from external timing
3. **Limited Exposure:** RSA operations are minimal in our use case
4. **Monitoring:** Track upstream updates to fastcrypto for future patches

## Unmaintained Dependencies

### 1. derivative v2.2.0 (RUSTSEC-2024-0388)
- **Impact:** LOW - Used for derive macros in cryptographic libraries
- **Mitigation:** Functionality is stable, no critical security impact

### 2. paste v1.0.15 (RUSTSEC-2024-0436)  
- **Impact:** LOW - Macro library with stable functionality
- **Mitigation:** No runtime security implications

### 3. serde_cbor v0.11.2 (RUSTSEC-2021-0127)
- **Impact:** LOW - Used by AWS Nitro Enclaves NSM API
- **Mitigation:** Controlled by AWS ecosystem, stable interface

## Recommendations

### Immediate Actions
1. Continue monitoring Mysten Labs fastcrypto updates
2. Implement additional timing attack protections in cryptographic operations
3. Regular security audits of TEE implementation

### Long-term Strategy
1. Evaluate alternative cryptographic libraries when available
2. Contribute to upstream fastcrypto security improvements
3. Implement formal verification for critical cryptographic paths

## Security Contacts
- Report vulnerabilities to the development team
- Monitor RustSec advisories for updates
- Track Mysten Labs security announcements

---
**Last Updated:** November 23, 2025  
**Next Review:** January 2026