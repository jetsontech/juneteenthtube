export const VIDEO_SCHEMA = {
  required: [
    "id",
    "title",
    "video_url",
    "created_at"
  ],

  optional: [
    "thumbnail_url",
    "views",
    "duration",
    "category",
    "state",
    "channel_name",
    "channel_avatar",
    "video_url_h264",
    "transcode_status",
    "owner_id",
    "is_featured",
    "is_trending",
    "featured_title",
    "featured_category"
  ]
};

export function validateVideoRow(row: unknown) {
  if (!row) return false;
  if (typeof row !== "object") return false;

  for (const key of VIDEO_SCHEMA.required) {
    if (!(key in row)) {
      return false;
    }
  }

  return true;
}
