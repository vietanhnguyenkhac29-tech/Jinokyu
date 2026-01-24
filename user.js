class User {
    constructor(id, username, email, avatar) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.avatar = avatar;
        this.status = 'offline';
        this.createdAt = new Date();
    }

    setStatus(status) {
        this.status = status;
    }

    getProfile() {
        return {
            id: this.id,
            username: this.username,
            avatar: this.avatar,
            status: this.status,
            createdAt: this.createdAt
        };
    }
}

module.exports = User;