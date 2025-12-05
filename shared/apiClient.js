// OpenProject API Client for Desktop App

const PROJECT_MAPPINGS = {
    'BD-TICKET': 151,
    'COMMON-SLASH-LEARNING-AND-UPSKILLING': 141,
    'COMMON-SLASH-RFS-AND-DEMO-SUPPORT': 140,
    'COMMON-SLASH-RESEARCH-AND-DEVELOPMENT-R-AND-D': 138,
    'COMMON-SLASH-GENERAL-PURPOSE-AND-MEETINGS-HR-ACTIVITY': 132,
    ELEARNING: 130,
    'INFO360-1': 129,
    'GENERAL-PROJECT-TASKS-MEETING-AND-SCRUM': 115,
    'ROBI-HR4U': 68,
    JBL: 67,
    CBL: 66,
    SEBL: 65,
    IDCOL: 64,
    HRIS: 63,
    'NEXT-GENERATION-PROVISING-SYSTEM-NGPS': 41,
    'IOT-AND-FWA': 21
};

const ACTIVITY_MAPPINGS = {
    Development: 1,
    Support: 2,
    Meeting: 3,
    Testing: 4,
    Specification: 5,
    Management: 6,
    'Change Request': 7,
    Other: 8
};

class ApiClient {
    constructor(api) {
        this.api = api; // electronAPI.apiRequest
    }

    async getProjects() {
        const result = await this.api({
            method: 'GET',
            endpoint: '/projects?pageSize=100'
        });
        if (!result.success) throw new Error(result.error);
        return result.data._embedded?.elements || [];
    }

    async getStatuses() {
        const result = await this.api({
            method: 'GET',
            endpoint: '/statuses'
        });
        if (!result.success) throw new Error(result.error);
        return result.data._embedded?.elements || [];
    }

    async checkExistingWorkPackageBySubject(projectId, subject) {
        const filters = JSON.stringify([{ project: { operator: '=', values: [String(projectId)] } }, { subject: { operator: '~', values: [subject.substring(0, 50)] } }]);

        const result = await this.api({
            method: 'GET',
            endpoint: `/work_packages?filters=${encodeURIComponent(filters)}&pageSize=10`
        });

        if (!result.success) throw new Error(result.error);

        const workPackages = result.data._embedded?.elements || [];
        return workPackages.find(wp => wp.subject.toLowerCase() === subject.toLowerCase()) || null;
    }

    async createWorkPackage(projectId, subject, statusId = 7) {
        const result = await this.api({
            method: 'POST',
            endpoint: `/projects/${projectId}/work_packages`,
            body: {
                subject,
                _links: {
                    status: { href: `/api/v3/statuses/${statusId}` }
                }
            }
        });
        if (!result.success) throw new Error(result.error);
        return result.data;
    }

    async createTimeEntry(workPackageId, projectId, hours, activityId, comment, spentOn) {
        const result = await this.api({
            method: 'POST',
            endpoint: '/time_entries',
            body: {
                hours: `PT${hours}H`,
                spentOn,
                _links: {
                    workPackage: { href: `/api/v3/work_packages/${workPackageId}` },
                    project: { href: `/api/v3/projects/${projectId}` },
                    activity: { href: `/api/v3/time_entries/activities/${activityId}` }
                },
                comment: { raw: comment }
            }
        });
        if (!result.success) throw new Error(result.error);
        return result.data;
    }

    async checkExistingTimeEntries(workPackageId, spentOn) {
        const filters = JSON.stringify([{ work_package: { operator: '=', values: [String(workPackageId)] } }, { spent_on: { operator: '=d', values: [spentOn] } }]);

        const result = await this.api({
            method: 'GET',
            endpoint: `/time_entries?filters=${encodeURIComponent(filters)}`
        });

        if (!result.success) throw new Error(result.error);
        return result.data._embedded?.elements || [];
    }
}

export { ApiClient, PROJECT_MAPPINGS, ACTIVITY_MAPPINGS };
