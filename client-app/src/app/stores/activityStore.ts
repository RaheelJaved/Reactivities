import { observable, action, computed, configure, runInAction } from 'mobx';
import { createContext, SyntheticEvent } from 'react';
import { IActivity } from '../models/activities';
import agent from '../api/agent';

configure({ enforceActions: 'always' });

class ActivityStore {
    @observable activityRegistry = new Map();
    @observable activities: IActivity[] = [];
    @observable selectedActivity: IActivity | undefined;
    @observable loadingInitial = false;
    @observable editMode = false;
    @observable submitting = false;
    @observable target = '';

    @computed get activitiesByDate() {
        return Array.from(this.activityRegistry.values()).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    }

    @action loadActivities = async () => {
        this.loadingInitial = true;
        try {
            const activities = await agent.Activities.list();
            runInAction('Loading activities - success', () => {
                activities.forEach((activity) => {
                    activity.date = activity.date.split('.')[0];
                    this.activityRegistry.set(activity.id, activity);
                });
                this.loadingInitial = false;
            });
        } catch (error) {
            console.log(error);
            runInAction('Loading activities - error', () => {
                this.loadingInitial = false;
            });
        }
    };

    @action createActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.create(activity);
            runInAction('createActivity - success', () => {
                this.activityRegistry.set(activity.id, activity);
                this.selectedActivity = activity;
                this.submitting = false;
                this.editMode = false;
            });
        } catch (error) {
            console.log(error);
            runInAction('createActivity - error', () => {
                this.submitting = false;
            });
        }
    };

    @action editActivity = async (activity: IActivity) => {
        this.submitting = true;
        try {
            await agent.Activities.update(activity);
            runInAction('editActivity - success', () => {
                this.activityRegistry.set(activity.id, activity);
                this.selectedActivity = activity;
                this.editMode = false;
                this.submitting = false;
            });
        } catch (error) {
            console.log(error);
            runInAction('editActivity - error', () => {
                this.submitting = false;
            });
        }
    };

    @action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.target = event.currentTarget.name;
        this.submitting = true;
        try {
            await agent.Activities.delete(id);
            runInAction('deleteActivity - success', () => {
                this.activityRegistry.delete(id);
                this.submitting = false;
                this.target = '';
            });
        } catch (error) {
            console.log(error);
            runInAction('deleteActivity - error', () => {
                this.submitting = false;
                this.target = '';
            });
        }
    };

    @action openCreateForm = () => {
        this.editMode = true;
        this.selectedActivity = undefined;
    };

    @action openEditForm = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = true;
    };

    @action cancelSelectedActivity = () => {
        this.selectedActivity = undefined;
    };

    @action cancelFormOpen = () => {
        this.editMode = false;
    };

    @action selectActivity = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = false;
    };
}

export default createContext(new ActivityStore());
