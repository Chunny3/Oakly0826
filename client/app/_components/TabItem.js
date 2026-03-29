import clsx from "clsx";

export default function TabItem({ children, onClick, className, ...props }) {
  return (
    <>
      <button className={clsx("btn tab-items", className)}
      onClick={onClick}
      {...props}
      >{children}</button>
    </>
  )
}
