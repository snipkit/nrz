import { useStore } from '@/state'

const Logo = () => {
  const { getResolvedTheme } = useStore()
  const theme = getResolvedTheme()

  return (
    <img
      src={
        theme === 'dark' ?
          '/logos/nrz-logo-light.png'
        : '/logos/nrz-logo-dark.png'
      }
      height={43}
      width={94}
    />
  )
}

export default Logo
