import { useClients } from "@/hooks/api/useClients";
import { useUsers } from "@/hooks/api/useUsers";

const selectCls =
  "w-full h-10 rounded-lg border border-input px-3 text-sm focus:border-ring outline-none bg-card";

export function ClientSelect({
  name = "clientId",
  defaultValue,
  required = true,
  className = selectCls,
}: {
  name?: string;
  defaultValue?: string | number;
  required?: boolean;
  className?: string;
}) {
  const { data, isLoading } = useClients({ perPage: 200, sort: "name", dir: "asc" });

  return (
    <select name={name} required={required} defaultValue={defaultValue} className={className}>
      <option value="" disabled>
        {isLoading ? "Chargement…" : "Sélectionner un client"}
      </option>
      {data?.items.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} — {c.company ?? "—"}
        </option>
      ))}
    </select>
  );
}

export function OwnerSelect({
  name = "ownerId",
  defaultValue,
  className = selectCls,
}: {
  name?: string;
  defaultValue?: string | number;
  className?: string;
}) {
  const { data } = useUsers();

  return (
    <select name={name} defaultValue={defaultValue} className={className}>
      <option value="">Moi-même</option>
      {data?.map((u) => (
        <option key={u.id} value={u.id}>
          {u.fullName}
        </option>
      ))}
    </select>
  );
}
