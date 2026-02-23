function ShortCard({ short, onDelete, onChangeThumbnail, onChangeVideo, onRename, landscapeMode = false }: {
    short: ShortVideo;
    onDelete?: (id: string) => void;
    onChangeThumbnail?: (id: string, file: File) => void;
    onChangeVideo?: (id: string, file: File) => void;
    onRename?: (id: string, newTitle: string) => void;
    landscapeMode?: boolean;
}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(short.title);
    const [isUploadingThumb, setIsUploadingThumb] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoFileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setIsDeleting(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDeleting && onDelete) {
            await onDelete(short.id);
            setIsMenuOpen(false);
        } else {
            setIsDeleting(true);
        }
    };

    const handleThumbnailClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
        setIsMenuOpen(false);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onChangeThumbnail) return;
        try {
            setIsUploadingThumb(true);
            await onChangeThumbnail(short.id, file);
        } catch (error) {
            console.error("Thumbnail update failed", error);
        } finally {
            setIsUploadingThumb(false);
        }
    };

    const toggleMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsMenuOpen(!isMenuOpen);
        setIsDeleting(false);
        // FIXED: Removed undefined showPreview check
    };

    const handleVideoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        videoFileInputRef.current?.click();
        setIsMenuOpen(false);
    };

    const handleRenameClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
        setIsMenuOpen(false);
    };

    const handleSaveTitle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (editTitle.trim() !== short.title && onRename) {
            await onRename(short.id, editTitle.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditTitle(short.title);
        setIsEditing(false);
    };

    const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onChangeVideo) return;
        try {
            setIsUploadingVideo(true);
            await onChangeVideo(short.id, file);
        } catch (error) {
            console.error("Video update failed", error);
        } finally {
            setIsUploadingVideo(false);
        }
    };

    const formatViews = (views: string | number) => {
        const num = typeof views === 'string' ? parseInt(views) : views;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    // ... rest of the component remains the same
