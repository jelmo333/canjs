import {
    ObservableArray,
    ObservableObject,
    realtimeRestModel,
    route,
    StacheElement,
    type,
} from "//unpkg.com/can@6/core.mjs";

class Message extends ObservableObject {
    static props = {
		id: Number,
		name: String,
		body: String,
		created_at: Date
	};

    static propertyDefaults = DeepObservable;
}

class MessageList extends ObservableArray {
    static props = {};

    static items = Message;
}

const MessageConnection = realtimeRestModel({
	url: {
		resource: 'https://chat.donejs.com/api/messages',
		contentType: 'application/x-www-form-urlencoded'
	},
	Map: Message,
	List: MessageList
});

const socket = io('https://chat.donejs.com');

socket.on('messages created', function(message){
	MessageConnection.createInstance(message);
});
socket.on('messages updated', function(message){
	MessageConnection.updateInstance(message);
});
socket.on('messages removed', function(message){
	MessageConnection.destroyInstance(message);
});

class ChatMessages extends StacheElement {
	static view = `
		<h1 class="page-header text-center">
				Chat Messages
		</h1>
		<h5><a href="{{ routeUrl(page='home') }}">Home</a></h5>

		{{# if(this.messagesPromise.isPending) }}
			<div class="list-group-item list-group-item-info">
				<h4 class="list-group-item-heading">Loading…</h4>
			</div>
		{{/ if }}
		{{# if(this.messagesPromise.isRejected) }}
			<div class="list-group-item list-group-item-danger">
				<h4 class="list-group3-item-heading">Error</h4>
				<p class="list-group-item-text">{{ this.messagesPromise.reason }}</p>
			</div>
		{{/ if }}
		{{# if(this.messagesPromise.isResolved) }}
			{{# for(message of this.messagesPromise.value) }}
				<div class="list-group-item">
					<h4 class="list-group3--item-heading">{{ message.name }}</h4>
					<p class="list-group-item-text">{{ message.body }}</p>
				</div>
			{{ else }}
				<div class="list-group-item">
					<h4 class="list-group-item-heading">No messages</h4>
				</div>
			{{/ for }}
		{{/ if }}

		<form class="row" on:submit="this.send(scope.event)">
			<div class="col-sm-3">
				<input type="text" class="form-control" placeholder="Your name"
					value:bind="this.name"/>
			</div>
			<div class="col-sm-6">
				<input type="text" class="form-control" placeholder="Your message"
					value:bind="this.body"/>
			</div>
			<div class="col-sm-3">
				<input type="submit" class="btn btn-primary btn-block" value="Send"/>
			</div>
		</form>
	`;

	static props = {
		// Properties
		messagesPromise: {
			get default() {
				return Message.getList({});
			}
		},

		name: type.maybeConvert(String),
		body: type.maybeConvert(String)
	};

	send(event) {
		event.preventDefault();

		new Message({
				name: this.name,
				body: this.body
		}).save().then(() => {
				this.body = "";
		});
	}
}
customElements.define("chat-messages", ChatMessages);

class ChatApp extends StacheElement {
	static view = `
		<div class="container">
			<div class="row">
				<div class="col-sm-8 col-sm-offset-2">
					{{# eq(this.routeData.page, 'home') }}
						<h1 class="page-header text-center" on:click="this.addExcitement()">
							{{ this.message }}
						</h1>
						<a href="{{ routeUrl(page='chat') }}"
							class="btn btn-primary btn-block btn-lg">
							Start chat
						</a>
					{{ else }}
						<chat-messages/>
					{{/ eq }}
				</div>
			</div>
		</div>
	`;

	static props = {
		// Properties
		message: {
			type: String,
			default: "Chat Home"
		},

		routeData: {
			get default() {
				route.register("{page}",{page: "home"});
				route.start();
				return route.data;
			}
		}
	};

	addExcitement() {
		this.message = this.message + "!";
	}
}
customElements.define("chat-app", ChatApp);
