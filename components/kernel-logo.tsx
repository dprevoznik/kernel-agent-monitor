/* eslint-disable @next/next/no-img-element */

export function KernelWordmark({ className }: { className?: string }) {
  return (
    <img
      src="/kernel/logo-kernel-green.svg"
      alt="Kernel"
      className={className}
      width={293}
      height={62}
    />
  )
}

export function KernelMark({ className }: { className?: string }) {
  return (
    <img
      src="/kernel/logo-kernel-square.svg"
      alt="Kernel"
      className={className}
      width={76}
      height={96}
    />
  )
}
