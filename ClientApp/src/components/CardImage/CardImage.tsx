type Props = {
  name: string;
  imageUrl: string | null;
  className?: string;
  placeholderClassName?: string;
  lazy?: boolean;
};

export default function CardImage({
  name,
  imageUrl,
  className,
  placeholderClassName,
  lazy,
}: Props) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={className} loading={lazy ? 'lazy' : undefined} />;
  }

  return <div className={placeholderClassName}>{name}</div>;
}
