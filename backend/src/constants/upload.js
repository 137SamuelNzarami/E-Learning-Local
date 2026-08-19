const UPLOAD = Object.freeze({
    MAX_IMAGE_SIZE: 5 * 1024 * 1024,
    MAX_VIDEO_SIZE: 500 * 1024 * 1024,
    MAX_DOCUMENT_SIZE: 20 * 1024 * 1024,
    
    IMAGES: [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    ],

    VIDEOS: [
        ".mp4",
        ".avi",
        ".mov"
    ],

    DOCUMENTS: [
        ".pdf",
        ".docx",
        ".pptx"
    ]

});

export default UPLOAD;