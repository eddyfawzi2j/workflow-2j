import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { RequestListItem } from "@/components/dashboard/request-list-item";
import { useRequests } from "@/hooks/use-requests";
import { RequestContext } from "@/context/request-context";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function ToApprove() {
  const { toApprove } = useRequests();
  const { openRequestDetailsModal } = React.useContext(RequestContext);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 8;
  
  // Check if user has approval permissions
  React.useEffect(() => {
    if (user && user.role !== "validator" && user.role !== "approver") {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Handle loading states
  const isLoading = toApprove.isLoading;
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  const requests = toApprove.data || [];
  
  // Calculate pagination
  const totalPages = Math.ceil(requests.length / requestsPerPage);
  const indexOfLastRequest = currentPage * requestsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - requestsPerPage;
  const currentRequests = requests.slice(indexOfFirstRequest, indexOfLastRequest);
  
  return (
    <MainLayout>
      <div className="py-6">
        {/* Page Header */}
        <div className="px-4 sm:px-6 md:px-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900">
                Demandes à approuver
              </h2>
            </div>
          </div>
        </div>
        
        {/* Requests List */}
        <div className="px-4 sm:px-6 md:px-8">
          <div className="bg-white shadow overflow-hidden rounded-md mb-8">
            {requests.length === 0 ? (
              <div className="p-8 text-center">
                <Card className="w-full max-w-md mx-auto">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center mb-4 gap-2">
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Aucune approbation en attente</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Vous n'avez aucune demande en attente de votre approbation pour le moment.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-gray-200">
                  {currentRequests.map((request) => (
                    <RequestListItem
                      key={request.id}
                      id={request.id}
                      ticketId={request.ticketId}
                      title={request.title}
                      status={request.status}
                      date={request.createdAt}
                      requester={request.requesterName || "Utilisateur inconnu"}
                      department={request.department}
                      onClick={() => openRequestDetailsModal(request.id)}
                    />
                  ))}
                </ul>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Affichage <span className="font-medium">{((currentPage - 1) * requestsPerPage) + 1}</span>{" "}
                          à{" "}
                          <span className="font-medium">
                            {Math.min(currentPage * requestsPerPage, requests.length)}
                          </span>{" "}
                          sur <span className="font-medium">{requests.length}</span> demandes
                        </p>
                      </div>
                      
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                              className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalPages)].map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => setCurrentPage(i + 1)}
                                isActive={currentPage === i + 1}
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                              className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
