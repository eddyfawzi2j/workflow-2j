import React, { createContext, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RequestFormModal } from "@/components/modals/request-form-modal";
import { RequestDetailsModal } from "@/components/modals/request-details-modal";

interface RequestContextType {
  openNewRequestModal: () => void;
  openRequestDetailsModal: (requestId: number) => void;
}

export const RequestContext = createContext<RequestContextType>({
  openNewRequestModal: () => {},
  openRequestDetailsModal: () => {},
});

export function RequestProvider({ children }: { children: React.ReactNode }) {
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: selectedRequest } = useQuery({
    queryKey: selectedRequestId ? [`/api/requests/${selectedRequestId}`] : null,
    enabled: !!selectedRequestId && isDetailsModalOpen,
  });

  const openNewRequestModal = () => {
    setIsNewRequestModalOpen(true);
  };

  const closeNewRequestModal = () => {
    setIsNewRequestModalOpen(false);
  };

  const openRequestDetailsModal = (requestId: number) => {
    setSelectedRequestId(requestId);
    setIsDetailsModalOpen(true);
  };

  const closeRequestDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRequestId(null);
  };

  return (
    <RequestContext.Provider
      value={{
        openNewRequestModal,
        openRequestDetailsModal,
      }}
    >
      {children}
      
      <RequestFormModal
        isOpen={isNewRequestModalOpen}
        onClose={closeNewRequestModal}
      />
      
      <RequestDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeRequestDetailsModal}
        request={selectedRequest}
      />
    </RequestContext.Provider>
  );
}
