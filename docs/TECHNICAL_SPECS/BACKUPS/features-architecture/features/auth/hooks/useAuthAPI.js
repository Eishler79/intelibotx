/**
 * 🔐 useAuthAPI - Authentication API Operations Orchestrator Hook  
 * SUCCESS CRITERIA compliance: ≤150 lines (orchestrator pattern)
 * 
 * RESPONSIBILITY: Compose specialized auth API hooks (login, register, logout)
 * PATTERN: DL-076 orchestrator + specialized hooks
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + SUCCESS CRITERIA ≤150 lines
 */

import useLogin from './useLogin';
import useRegister from './useRegister';
import useLogout from './useLogout';

/**
 * Orchestrator hook for authentication API operations
 * Composes: useLogin + useRegister + useLogout specialized hooks
 */
export const useAuthAPI = (authState, loadUserExchanges) => {
  // ✅ Specialized hooks composition (no duplication)
  const { login } = useLogin(authState, loadUserExchanges);
  const { register } = useRegister(authState, loadUserExchanges);
  const { logout } = useLogout(authState);

  return {
    login,
    register,
    logout,
  };
};

export default useAuthAPI;