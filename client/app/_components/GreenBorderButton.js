export default function GreenBorderButton({ children, onClick, bgGreen, ...props }) {
  return (
    <>
      <button 
      className={`btn btn-green${bgGreen || ''}`}
      onClick={onClick}
      {...props}
      >{children}

      </button>
    </>
  )
}
