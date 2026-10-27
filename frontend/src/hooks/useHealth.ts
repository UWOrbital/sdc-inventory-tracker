import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/endpoints/health";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => getHealth(signal),
  });
}
