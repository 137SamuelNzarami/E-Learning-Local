const REGEX = Object.freeze({

    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    PHONE: /^[0-9+\-\s]+$/,

    PASSWORD:
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/,

    SLUG: /^[a-z0-9-]+$/i

});

export default REGEX;