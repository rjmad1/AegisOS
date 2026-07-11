import { useQuery, useMutation } from "@tanstack/react-query";
import { LoadModelRequestDto } from "@/api/dtos";

// Mock querying services
export function useServedModels() {
  return useQuery({
    queryKey: ["served-models"],
    queryFn: async () => {
      // Simulate fetch delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return ["gemma4:latest", "deepseek-r1:32b", "qwen2.5:14b", "qwen3:14b"];
    },
  });
}

export function useHostMetrics() {
  return useQuery({
    queryKey: ["host-metrics"],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        cpuUsage: 12.4,
        memoryUsage: 42.1, // of 64 GB
        vramUsage: 60.5, // of 16 GB RTX 5080
        uptime: 86400, // 24 hours
      };
    },
    refetchInterval: 5000, // Sync loop
  });
}

export function useLoadModelMutation() {
  return useMutation({
    mutationFn: async (dto: LoadModelRequestDto) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return {
        modelName: dto.modelName,
        status: "loaded" as const,
        allocatedVram: 9.3 * 1024 * 1024 * 1024, // 9.3 GB in bytes
        port: 11434,
      };
    },
  });
}
