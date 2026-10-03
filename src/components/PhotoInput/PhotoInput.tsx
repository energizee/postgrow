import { useId, useState, type ChangeEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { resizeImage } from "../../lib/image";
import "./PhotoInput.css";

type PhotoInputProps = {
  value: string | null;
  onChange: (image: string | null) => void;
  required?: boolean;
  error?: string;
};

const ICON_SIZE = 22;

export function PhotoInput({ value, onChange, required = false, error }: PhotoInputProps) {
  const id = useId();
  const [loading, setLoading] = useState(false);
  const [readError, setReadError] = useState("");

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setLoading(true);
    setReadError("");
    try {
      onChange(await resizeImage(file));
    } catch {
      setReadError("That file isn't an image we can read. Try a JPG or PNG.");
    } finally {
      setLoading(false);
    }
  }

  const message = readError || error;

  return (
    <div className="field">
      <span className="field__label" id={`${id}-label`}>
        Photo{required ? "" : " (optional)"}
      </span>
      <input
        id={id}
        className="visually-hidden photo-input__file"
        type="file"
        accept="image/*"
        aria-labelledby={`${id}-label`}
        aria-required={required}
        onChange={handleFile}
      />
      {value ? (
        <div className="photo-input__preview">
          <img src={value} alt="Your proof photo" />
          <button type="button" className="icon-btn photo-input__remove" onClick={() => onChange(null)} aria-label="Remove photo">
            <X size={ICON_SIZE} />
          </button>
        </div>
      ) : (
        <label className="photo-input__drop" htmlFor={id} data-invalid={Boolean(message)}>
          <ImagePlus size={ICON_SIZE} aria-hidden="true" />
          {loading ? "Preparing photo" : "Add photo"}
        </label>
      )}
      <span className="field__hint">Keep faces, house numbers and names out of shot.</span>
      {message && (
        <span className="field__error" role="alert">
          {message}
        </span>
      )}
    </div>
  );
}
