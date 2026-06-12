export default function SectionHeading({
  index,
  designation,
  title,
}: {
  index: string;
  designation: string;
  title: string;
}) {
  return (
    <div className="mb-14 flex items-end justify-between border-b border-hairline pb-5">
      <div>
        <p className="label mb-3 text-starlight/70">{designation}</p>
        <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-none text-ink">
          {title}
        </h2>
      </div>
      <span className="label hidden text-[10px]! text-dim sm:block">{index}</span>
    </div>
  );
}
