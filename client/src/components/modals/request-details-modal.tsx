import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { SignaturePad } from "@/components/ui/signature-pad";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ApprovalTimeline } from "@/components/workflow/approval-timeline";
import { Ticket, Calendar, FileText } from "lucide-react";
import { approvalActionSchema, type ApprovalAction } from "@shared/schema";

interface Document {
  name: string;
  type: string;
  size: number;
}

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: {
    id: number;
    ticketId: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
    priority: string;
    department: string;
    requester: {
      id: number;
      fullName: string;
      department: string;
    };
    currentApprover: number;
    documents?: Document[];
    approvalSteps: Array<{
      id: number;
      userId: number;
      status: string;
      role: string;
      order: number;
      actionDate: string | null;
      comments: string | null;
      signature: string | null;
      user?: {
        fullName: string;
        role: string;
      };
    }>;
  } | null;
}

export function RequestDetailsModal({ isOpen, onClose, request }: RequestDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [signature, setSignature] = useState<string | null>(null);
  
  const form = useForm<ApprovalAction>({
    resolver: zodResolver(approvalActionSchema),
    defaultValues: {
      requestId: request?.id || 0,
      comments: "",
      signature: null,
      action: "approve"
    }
  });
  
  const isSubmitting = form.formState.isSubmitting;
  const isCurrentApprover = user?.id === request?.currentApprover;
  
  const handleApprovalAction = async (data: ApprovalAction & { action: "approve" | "reject" }) => {
    if (!request) return;
    
    try {
      // Include signature in the form data
      data.signature = signature;
      data.requestId = request.id;
      
      const res = await apiRequest(
        "POST", 
        `/api/requests/${request.id}/approve`, 
        data
      );
      
      if (!res.ok) {
        throw new Error(`Failed to ${data.action} request`);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: [`/api/requests/${request.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Success",
        description: `Request ${data.action === "approve" ? "approved" : "rejected"} successfully.`,
        variant: "default"
      });
      
      onClose();
    } catch (error) {
      console.error(`Error ${data.action}ing request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${data.action} the request. Please try again.`,
        variant: "destructive"
      });
    }
  };
  
  if (!request) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <div className="flex justify-between items-center">
            <DialogTitle>{request.title}</DialogTitle>
            <StatusBadge status={request.status} />
          </div>
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <Ticket className="mr-1.5 h-4 w-4 text-gray-400" />
              <span>{request.ticketId}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
              <span>Created on {formatDate(request.createdAt)}</span>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          <div className="border-b border-gray-200 pb-2">
            <h4 className="text-md font-medium text-gray-900">Request Details</h4>
          </div>
          
          <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Requester</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.requester.fullName}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.department}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900">{request.priority}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Current Approver</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {isCurrentApprover 
                  ? `You (${user?.role})` 
                  : request.status === "approved" || request.status === "rejected"
                    ? "None - Request finalized"
                    : "Pending next approver"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {request.description}
              </dd>
            </div>
          </dl>
          
          {request.documents && request.documents.length > 0 && (
            <div className="mt-6 border-t border-b border-gray-200 py-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Supporting Documents</h4>
              <ul className="divide-y divide-gray-200">
                {request.documents.map((doc, index) => (
                  <li key={index} className="py-3 flex justify-between items-center">
                    <div className="flex items-center">
                      <FileText className="text-gray-400 mr-2 h-5 w-5" />
                      <span className="text-sm text-gray-900">{doc.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary">
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Approval Workflow</h4>
            <ApprovalTimeline steps={request.approvalSteps} />
          </div>
          
          {/* Approval Action (Only for approvers) */}
          {isCurrentApprover && request.status === "pending_approval" && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Your Action Required</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(values => {
                    const action = values.action as "approve" | "reject";
                    handleApprovalAction({ ...values, action });
                  })} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="comments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comments</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any comments regarding your decision"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Electronic Signature */}
                    <FormField
                      control={form.control}
                      name="signature"
                      render={() => (
                        <FormItem>
                          <FormLabel>Electronic Signature</FormLabel>
                          <FormControl>
                            <SignaturePad
                              onChange={setSignature}
                              value={signature}
                            />
                          </FormControl>
                          {!signature && (
                            <p className="text-sm text-amber-600 mt-1">
                              Signature is required to approve or reject
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-3 mt-4">
                      <Button 
                        type="button" 
                        variant="destructive"
                        disabled={isSubmitting || !signature}
                        onClick={() => {
                          form.setValue("action", "reject");
                          form.handleSubmit(values => 
                            handleApprovalAction({ ...values, action: "reject" })
                          )();
                        }}
                      >
                        Reject
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || !signature}
                        onClick={() => form.setValue("action", "approve")}
                      >
                        Approve
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
