import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import "./TrackingPixelsCard.scss";

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
    <Card className="tracking-pixels-card">
      <CardHeader className="tracking-pixels-card__header">
        <CardTitle className="tracking-pixels-card__title">Facebook</CardTitle>
      </CardHeader>
      <CardContent className="tracking-pixels-card__content">
        <div className="tracking-pixels-card__field">
          <Label htmlFor={pixelIdName}>Facebook Pixel ID</Label>
          <Input
            id={pixelIdName}
            type="text"
            placeholder="Enter Facebook Pixel ID"
            aria-label="Facebook Pixel ID"
            className="tracking-pixels-card__input"
            {...register(pixelIdName)}
          />
        </div>
        <div className="tracking-pixels-card__field">
          <Label htmlFor={conversionTokenName}>
            Conversion API access token (optional)
          </Label>
          <Input
            id={conversionTokenName}
            type="text"
            placeholder="Enter Conversion API access token"
            aria-label="Conversion API access token"
            className="tracking-pixels-card__input"
            {...register(conversionTokenName)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
