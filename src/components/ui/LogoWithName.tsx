import logo from '../../assets/logo.png'

export default function LogoWithName({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <img src={logo} alt="Children's Book for All" className="h-14 w-auto object-contain" />
      <span className="font-gluten font-[600] text-primary leading-none text-lg flex flex-col uppercase">
        <span>Children's</span>
        <span>Book</span>
        <span>for All</span>
      </span>
    </div>
  )
}
