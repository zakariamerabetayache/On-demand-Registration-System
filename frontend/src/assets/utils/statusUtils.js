// Status configurations for different entities
export const getStatusConfig = (status, type = "") => {
  const configs = {
    // Add more entity types here as needed
    user: {
      admin: {
        color: "#27ae60",
        bg: "rgba(46, 204, 113, 0.15)",
        text: "administrator",
      },
      manager: {
        color: "#95a5a6",
        bg: "rgba(149, 165, 166, 0.15)",
        text: "manager",
      },

    },
    post: {
      false: {
        color: "#27ae60",
        bg: "rgba(46, 204, 113, 0.15)",
        text: "draft",
      },
      true: {
        color: "#95a5a6",
        bg: "rgba(149, 165, 166, 0.15)",
        text: "published",
      },
    },
    concern: {

      1: {
        color: "#27ae60",
        bg: "rgba(46, 204, 113, 0.15)",
        text: "pending",
      },
      2: {
        color: "#95a5a6",
        bg: "rgba(149, 165, 166, 0.15)",
        text: "approved",
      },
      3: {
        color: "#95a5a6",
        bg: "rgba(149, 165, 166, 0.15)",
        text: "rejected",
      },
    },
    party_member: {
      in_waiting: {
        color: "#faad14",
        bg: "rgba(250, 173, 20, 0.15)",
        text: "in_waiting",
      },
      joined: {
        color: "#52c41a",
        bg: "rgba(82, 196, 26, 0.15)",
        text: "joined",
      },
      inactive: {
        color: "#ff4d4f",
        bg: "rgba(255, 77, 79, 0.15)",
        text: "inactive",
      },
    },

  };

  const typeConfig = configs[type] || configs.user;
  return (
    typeConfig[status] || {
      color: "#95a5a6",
      bg: "rgba(149, 165, 166, 0.15)",
      icon: null,
      text: status,
    }
  );
};
