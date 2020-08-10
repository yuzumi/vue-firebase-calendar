<template>
  <v-row class="fill-height">
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat color="white">
          <v-btn outlined class="mr-4" color="grey darken-2" @click="setToday">
            Today
          </v-btn>
          <v-btn fab text small color="grey darken-2" @click="prev">
            <v-icon small>mdi-chevron-left</v-icon>
          </v-btn>
          <v-btn fab text small color="grey darken-2" @click="next">
            <v-icon small>mdi-chevron-right</v-icon>
          </v-btn>
          <v-toolbar-title v-if="$refs.calendar">
            {{ $refs.calendar.title }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-menu bottom right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                outlined
                color="grey darken-2"
                v-bind="attrs"
                v-on="on"
              >
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>Day</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'week'">
                <v-list-item-title>Week</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'month'">
                <v-list-item-title>Month</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = '4day'">
                <v-list-item-title>4 days</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>
      </v-sheet>
      <v-sheet height="600">
        <v-calendar
          ref="calendar"
          v-model="focus"
          color="primary"
          :events="events"
          :event-color="getEventColor"
          :type="type"
          @click:event="showEvent"
          @click:more="viewDay"
          @click:date="viewDay"
          @change="updateRange"
        ></v-calendar>
        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
        >
          <v-card
            color="grey lighten-4"
            min-width="350px"
            flat
          >
            <v-toolbar
              :color="selectedEvent.color"
              dark
            >
              <v-btn icon @click="deleteEvent(selectedEvent.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>
            <v-card-text>
              <form v-if="currentlyEditing !== selectedEvent.id">
                {{ selectedEvent.details }}
              </form>
              <form v-else>
                <textarea-autosize
                  v-model="selectedEvent.details"
                  type="text"
                  style="width: 100%;"
                  :min-height="100"
                  placeholder="Add note"
                />
              </form>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                color="secondary"
                @click="selectedOpen = false"
              >
                Close
              </v-btn>
              <v-btn
                text
                v-if="currentlyEditing !== selectedEvent.id"
                @click.prevent="editEvent(selectedEvent)"
              >
                Edit
              </v-btn>
              <v-btn
                text
                v-else
                @click.prevent="updateEvent(selectedEvent)"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-sheet>
    </v-col>
  </v-row>
</template>

<script>
import { firestore } from '@/main';

const today = () => new Date().toISOString().substr(0, 10);

export default {
  name: 'Calendar',
  data: () => ({
    today: today(),
    focus: today(),
    type: 'month',
    typeToLabel: {
      month: 'Month',
      week: 'Week',
      day: 'Day',
      '4day': '4 Days',
    },
    event: {
      name: null,
      details: null,
      start: null,
      end: null,
      color: '#0095dd',
    },
    currentlyEditing: false,
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    events: [],
    dialog: false,
  }),
  mounted() {
    this.$refs.calendar.checkChange();
    this.getEvents();
  },
  methods: {
    async getEvents() {
      const snapshop = await firestore.collection('events').get();
      const events = [];

      snapshop.forEach((document) => {
        const event = {
          id: document.id,
          ...document.data(),
        };

        events.push(event);
      });

      this.events = events;
    },
    getEventColor(event) {
      return event.color;
    },
    viewDay({ date }) {
      this.focus = date;
      this.type = 'day';
    },
    setToday() {
      this.focus = this.today;
    },
    prev() {
      this.$refs.calendar.prev();
    },
    next() {
      this.$refs.calendar.next();
    },
    showEvent({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event;
        this.selectedElement = nativeEvent.target;

        setTimeout(() => { this.selectedOpen = true; }, 10);
      };

      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
      }

      nativeEvent.stopPropagation();
    },
    editEvent(event) {
      this.currentlyEditing = event.id;
    },
    async updateEvent(event) {
      await firestore
        .collection('events')
        .doc(this.currentlyEditing)
        .update({
          details: event.details,
        });

      this.selectedOpen = false;
      this.currentlyEditing = null;
    },
    async deleteEvent(eventId) {
      await firestore
        .collection('events')
        .doc(eventId)
        .delete();

      this.selectedOpen = false;
      await this.getEvents();
    },
    updateRange({ start, end }) {
      const events = [];

      const min = new Date(`${start.date}T00:00:00`);
      const max = new Date(`${end.date}T23:59:59`);
      const days = (max.getTime() - min.getTime()) / 86400000;
      const eventCount = this.rnd(days, days + 20);

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < eventCount; i++) {
        const allDay = this.rnd(0, 3) === 0;
        const firstTimestamp = this.rnd(min.getTime(), max.getTime());
        const first = new Date(firstTimestamp - (firstTimestamp % 900000));
        const secondTimestamp = this.rnd(2, allDay ? 288 : 8) * 900000;
        const second = new Date(first.getTime() + secondTimestamp);

        events.push({
          name: this.names[this.rnd(0, this.names.length - 1)],
          start: first,
          end: second,
          color: this.colors[this.rnd(0, this.colors.length - 1)],
          timed: !allDay,
        });
      }

      this.events = events;
    },
    rnd(a, b) {
      return Math.floor((b - a + 1) * Math.random()) + a;
    },
  },
};
</script>
