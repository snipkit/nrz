const Logo = () => {
  return (
    <>
      <img
        className="hidden dark:block"
        src="/logos/nrz-logo-light.png"
        height={43}
        width={94}
      />

      <img
        className="block dark:hidden"
        src="/logos/nrz-logo-dark.png"
        height={43}
        width={94}
      />
    </>
  )
}

export default Logo
