"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TripCategory } from "@/lib/constants/trip-categories";
import { Calendar as CalendarIcon, Upload, Info } from "lucide-react";

// Define the form schema with zod
const tripFormSchema = z.object({
  name: z.string().min(3, "Trip name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  isPublic: z.boolean().default(false),
  thumbnail: z.string().optional(),
  minMembers: z.number().min(1, "Minimum members must be at least 1").max(20, "Maximum members cannot exceed 20").default(2),
});

type TripFormValues = z.infer<typeof tripFormSchema>;

export default function EditTripPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      category: "",
      isPublic: false,
      thumbnail: "",
      minMembers: 2,
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchTrip();
    }
  }, [status, router, id]);

  const fetchTrip = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trips/${id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch trip");
      }

      const data = await response.json();
      const trip = data.trip;

      // Check if user is author
      const isAuthor = trip.members.some(
        (member: { user: { _id: string }; role: string }) =>
          member.user._id === session?.user.id && member.role === "author"
      );

      if (!isAuthor) {
        toast({
          title: "Unauthorized",
          description: "Only the trip author can edit this trip",
          variant: "destructive",
        });
        router.push(`/trips/${id}`);
        return;
      }

      // Convert string dates to Date objects
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);

      // Set the form values
      form.reset({
        name: trip.name,
        description: trip.description,
        startDate,
        endDate,
        category: trip.category,
        isPublic: trip.isPublic,
        thumbnail: trip.thumbnail || "",
        minMembers: trip.minMembers || 2,
      });

      // Set preview image
      if (trip.thumbnail) {
        setPreviewImage(trip.thumbnail);
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Image must be smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);

    try {
      setImageUploadStatus("uploading");

      // Create FormData and append the file
      const formData = new FormData();
      formData.append("file", file);

      // Upload to server
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload image");
      }

      const data = await response.json();

      // Set the cloudinary URL in the form
      form.setValue("thumbnail", data.url);
      setImageUploadStatus("success");

      toast({
        title: "Image Uploaded",
        description: "Thumbnail image has been updated",
      });

    } catch (error: any) {
      console.error("Error uploading image:", error);
      setImageUploadStatus("error");
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload thumbnail image",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: TripFormValues) => {
    try {
      setIsLoading(true);

      // For now, we'll keep using the preview image as the thumbnail
      // In a real implementation, you would use the URL returned from your image hosting service
      if (previewImage && !values.thumbnail) {
        values.thumbnail = previewImage;
      }

      const response = await fetch(`/api/trips/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update trip");
      }

      toast({
        title: "Trip updated",
        description: "Trip has been updated successfully",
      });

      router.push(`/trips/${id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-4 w-1/3"></div>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Trip</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter trip name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your trip"
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TripCategory).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="minMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Members</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      placeholder="Minimum required members"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Set the minimum number of members needed for this trip (1-20)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Thumbnail</FormLabel>
                  <div className="flex flex-col space-y-4">
                    {previewImage && (
                      <div className="relative w-full h-48 rounded-md overflow-hidden">
                        <Image
                          src={previewImage}
                          alt="Trip thumbnail preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="thumbnail-upload"
                            onChange={handleImageUpload}
                          />
                          <label
                            htmlFor="thumbnail-upload"
                            className="flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          >
                            <Upload className="h-4 w-4" />
                            Choose Image
                          </label>
                        </div>
                      </FormControl>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        Recommended size: 1200x800 pixels, max 5MB
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Public Trip</FormLabel>
                    <FormDescription>
                      Make this trip visible to other users who can request to join
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/trips/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
