import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  photo?: string | null;
  name?: string;
  firstName?: string;
  lastName?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

function userInitials(props: UserAvatarProps): string {
  if (props.name) {
    const initials = props.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2);
    if (initials) return initials.toUpperCase();
  }
  return `${(props.firstName ?? "")[0] ?? ""}${(props.lastName ?? "")[0] ?? ""}`.toUpperCase();
}

export function UserAvatar({
  photo,
  name,
  firstName,
  lastName,
  className,
  imageClassName,
  fallbackClassName,
}: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {photo ? (
        <AvatarImage
          src={photo}
          alt={name ?? `${firstName ?? ""} ${lastName ?? ""}`}
          className={imageClassName}
        />
      ) : null}
      <AvatarFallback className={fallbackClassName}>
        {userInitials({ name, firstName, lastName })}
      </AvatarFallback>
    </Avatar>
  );
}
