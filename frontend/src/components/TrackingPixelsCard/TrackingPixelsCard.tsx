import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
export interface TrackingPixelsCardProps {
  register: UseFormRegister<Record<string, string>>;
  errors?: FieldErrors<Record<string, string>>;
  /** Field name for Facebook Pixel ID */
  pixelIdName?: string;
  /** Field name for Conversion API token */
  conversionTokenName?: string;
}

const DEFAULT_PIXEL_ID_NAME = "facebookPixelId";
const DEFAULT_CONVERSION_TOKEN_NAME = "conversionApiToken";

export default function TrackingPixelsCard({
  register,
  pixelIdName = DEFAULT_PIXEL_ID_NAME,
  conversionTokenName = DEFAULT_CONVERSION_TOKEN_NAME,
}: TrackingPixelsCardProps) {
  return (
    <Card className="mb-4 rounded-lg border border-neutral-200 bg-white p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-black">Facebook</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="[&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
          <Label htmlFor={pixelIdName}>Facebook Pixel ID</Label>
          <Input
            id={pixelIdName}
            type="text"
            placeholder="Enter Facebook Pixel ID"
            aria-label="Facebook Pixel ID"
            className="w-full"
            {...register(pixelIdName)}
          />
        </div>
        <div className="[&_label]:mb-1.5 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-black">
          <Label htmlFor={conversionTokenName}>
            Conversion API access token (optional)
          </Label>
          <Input
            id={conversionTokenName}
            type="text"
            placeholder="Enter Conversion API access token"
            aria-label="Conversion API access token"
            className="w-full"
            {...register(conversionTokenName)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
