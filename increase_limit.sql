-- Increase limit to 1GB (1073741824 bytes) for 'videos' bucket
update storage.buckets
set file_size_limit = 1073741824, 
    allowed_mime_types = '{video/*}'
where id = 'videos';
