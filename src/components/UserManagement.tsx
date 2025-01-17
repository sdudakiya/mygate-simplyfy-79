import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type UserProfile = {
  id: string;
  role: "admin" | "security" | "flat_owner";
  flat_id: string | null;
  email?: string;
};

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: users } = useQuery({
    queryKey: ["users-profiles"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id,
          role,
          flat_id,
          auth.users!inner(email)
        `);

      if (error) throw error;
      return profiles.map((profile: any) => ({
        ...profile,
        email: profile.users?.email,
      }));
    },
  });

  const { data: flats } = useQuery({
    queryKey: ["flats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flats")
        .select("id, flat_number");
      if (error) throw error;
      return data;
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
      flatId,
    }: {
      userId: string;
      role: "admin" | "security" | "flat_owner";
      flatId?: string | null;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role, flat_id: flatId })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-profiles"] });
      toast.success("User updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update user: " + error.message);
    },
  });

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      <div className="grid gap-4">
        {users?.map((user: UserProfile) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-lg">{user.email}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select
                  value={user.role}
                  onValueChange={(value: "admin" | "security" | "flat_owner") =>
                    updateUserMutation.mutate({
                      userId: user.id,
                      role: value,
                      flatId: user.flat_id,
                    })
                  }
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="flat_owner">Flat Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {user.role === "flat_owner" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Flat Number
                  </label>
                  <Select
                    value={user.flat_id || ""}
                    onValueChange={(value) =>
                      updateUserMutation.mutate({
                        userId: user.id,
                        role: user.role,
                        flatId: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select flat" />
                    </SelectTrigger>
                    <SelectContent>
                      {flats?.map((flat) => (
                        <SelectItem key={flat.id} value={flat.id}>
                          {flat.flat_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;