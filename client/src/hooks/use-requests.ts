import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all requests
  const allRequests = useQuery({
    queryKey: ["/api/requests"],
  });

  // Fetch my requests
  const myRequests = useQuery({
    queryKey: ["/api/requests/my"],
  });

  // Fetch requests to approve
  const toApprove = useQuery({
    queryKey: ["/api/requests/to-approve"],
  });

  // Fetch request stats
  const stats = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch a specific request
  const getRequest = (id: number) => {
    return useQuery({
      queryKey: [`/api/requests/${id}`],
    });
  };

  // Create a new request
  const createRequest = useMutation({
    mutationFn: async (requestData: any) => {
      const response = await apiRequest("POST", "/api/requests", requestData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Success",
        description: "Request created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create request: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Approve or reject a request
  const approveRequest = useMutation({
    mutationFn: async ({
      requestId,
      action,
      comments,
      signature,
    }: {
      requestId: number;
      action: "approve" | "reject";
      comments?: string;
      signature?: string;
    }) => {
      const response = await apiRequest("POST", `/api/requests/${requestId}/approve`, {
        action,
        comments,
        signature,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/to-approve"] });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${variables.requestId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Success",
        description: `Request ${variables.action === "approve" ? "approved" : "rejected"} successfully`,
      });
    },
    onError: (error, variables) => {
      toast({
        title: "Error",
        description: `Failed to ${variables.action} request: ${error}`,
        variant: "destructive",
      });
    },
  });

  return {
    allRequests,
    myRequests,
    toApprove,
    stats,
    getRequest,
    createRequest,
    approveRequest,
  };
}
