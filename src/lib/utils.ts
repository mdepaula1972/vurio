import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Valida CPF matematicamente (D014 / R012)
 * Retorna true se o CPF for válido
 */
export function validateCpf(cpf: string): boolean {
  // Remover caracteres não numéricos
  const cleanCpf = cpf.replace(/\D/g, "");

  // Verificar se tem 11 dígitos
  if (cleanCpf.length !== 11) return false;

  // Evitar sequências idênticas conhecidas
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCpf.charAt(9))) return false;

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cleanCpf.charAt(10))) return false;

  return true;
}

/**
 * Máscara parcial para CPF (D012 - LGPD)
 * Exemplo: 123.456.789-00 -> ***.***-789-**
 */
export function maskCpf(cpf: string): string {
  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11) return cpf;
  
  // Exibir apenas os 3 dígitos centrais (posições 6, 7 e 8)
  const part1 = "***.***";
  const visible = cleanCpf.substring(6, 9);
  const part2 = "**";
  
  return `${part1}-${visible}-${part2}`;
}
