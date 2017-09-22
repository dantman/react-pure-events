import {inspect} from 'util';
import React, {PureComponent} from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {wrapPureEventProps, guardPureEventProps} from '../src/';

function makeMock(decorator, ...args) {
	const id = {};
	let renderCount = 0;
	let renderProps;
	class MySourceComponent extends PureComponent {
		static staticFunction() {
			return id;
		}
		prototypeMethod() {
			return id;
		}
		instanceMethod = () => {
			return id;
		};

		getThis() {
			return this;
		}

		render() {
			renderCount++;
			renderProps = this.props;

			return null;
		}
	}

	let MyComponent = MySourceComponent;
	if ( decorator !== null ) {
		MyComponent = decorator(...args)(MyComponent); // eslint-disable-line no-class-assign
	}

	let host;
	return {
		id,
		MySourceComponent,
		MyComponent,
		render(props) {
			const root = <MyComponent {...props} />;

			if ( host ) {
				host.update(root);
			} else {
				host = ReactTestRenderer.create(root);
			}

			return {
				ref: host.getInstance(),
				count: renderCount,
				props: renderProps,
			};
		},
	};
}

function wrapMock(...args) {
	return makeMock(wrapPureEventProps, ...args);
}

function guardMock(...args) {
	return makeMock(guardPureEventProps, ...args);
}

function nullMock(...args) {
	return makeMock(null, ...args);
}

/**
 * Universal tests that should also be run in the control group
 */
function runUniversalTestsFor(theMock) {
	test('Static functions are hoisted', () => {
		const renderer = theMock('onEvent');

		expect(renderer.MyComponent).toHaveProperty('staticFunction');
		expect(renderer.MyComponent.staticFunction()).toBe(renderer.id);
	});

	test('Prototype methods are hoisted', () => {
		const renderer = theMock('onEvent');

		const result = renderer.render({});

		expect(result.ref.prototypeMethod()).toBe(renderer.id);
	});

	test('`this` in hoisted prototype methods is correct', () => {
		const renderer = theMock('onEvent');

		const result = renderer.render({});

		expect(result.ref.getThis().props).toBe(result.props);
	});

	test('Unrelated props are passed through unmodified', () => {
		const renderer = theMock('onEvent');

		const props = {
			undefined,
			null: null,
			false: false,
			true: true,
			zero: 0,
			one: 1,
			empty: '',
			string: 'string',
			obj: {},
			arr: [],
			function: () => {},
		};

		const result = renderer.render(props);

		expect(result.props).toMatchObject(props);
	});

	test('Event props are called when the function passed to the wrapped component is called', () => {
		const renderer = theMock('onEvent');

		const props = {
			onEvent: jest.fn(),
		};

		const result = renderer.render(props);

		expect(result.props).toHaveProperty('onEvent');
		expect(typeof result.props.onEvent).toBe('function');
		result.props.onEvent();

		expect(props.onEvent).toHaveBeenCalled();
	});

	test('Arguments passed to event props are maintained', () => {
		const renderer = theMock('onEvent');

		const props = {
			onEvent: jest.fn(),
		};

		const result = renderer.render(props);

		expect(result.props).toHaveProperty('onEvent');
		expect(typeof result.props.onEvent).toBe('function');
		result.props.onEvent(1, 2, 3);

		expect(props.onEvent).toHaveBeenCalledWith(1, 2, 3);
	});
}

/**
 * Tests common to both decotators
 */
function runCommonTestsFor(theMock) {
	test('Event functions are replaced', () => {
		const renderer = theMock('onEvent');

		const props = {
			onEvent: () => {},
		};

		const result = renderer.render(props);

		expect(result.props).toHaveProperty('onEvent');
		expect(typeof result.props.onEvent).toBe('function');
		expect(result.props.onEvent).not.toBe(props.onEvent);
	});

	test('An event prop with different function instances only renders once', () => {
		const renderer = theMock('onEvent');

		const result1 = renderer.render({onEvent: () => {}});
		expect(result1.count).toBe(1);

		const result2 = renderer.render({onEvent: () => {}});
		expect(result2.count).toBe(1);
	});

	test('A non-event prop with different function instances re-renders each time', () => {
		const renderer = theMock('onEvent');

		const result1 = renderer.render({nonEvent: () => {}});
		expect(result1.count).toBe(1);

		const result2 = renderer.render({nonEvent: () => {}});
		expect(result2.count).toBe(2);
	});

	for ( const args of [['onEvent'], ['myEvent', 'onEvent'], [['onEvent']]] ) {
		describe(`${theMock.name.replace(/Mock$/, 'PureEventProps')}(${args.map((val) => inspect(val)).join(', ')})`, () => {
			test('An event prop with different function instances only renders once', () => {
				const renderer = theMock(...args);

				const result1 = renderer.render({onEvent: () => {}});
				expect(result1.count).toBe(1);

				const result2 = renderer.render({onEvent: () => {}});
				expect(result2.count).toBe(1);
			});
		});
	}
}

/**
 * Control group
 */
describe('Without a decorator', () => {
	const theMock = nullMock;
	// Test that these basic tests run fine without our decorators
	runUniversalTestsFor(nullMock);

	test('Event functions are not replaced', () => {
		const renderer = theMock('onEvent');

		const props = {
			onEvent: () => {},
		};

		const result = renderer.render(props);

		expect(result.props).toMatchObject(props);
	});

	test('An event prop with different function instances re-renders each time', () => {
		const renderer = theMock('onEvent');

		const result1 = renderer.render({onEvent: () => {}});
		expect(result1.count).toBe(1);

		const result2 = renderer.render({onEvent: () => {}});
		expect(result2.count).toBe(2);
	});
});

/**
 * wrapPureEventProps
 */
describe('wrapPureEventProps', () => {
	const theMock = wrapMock;
	runUniversalTestsFor(theMock);
	runCommonTestsFor(theMock);

	for ( const value of [undefined, null, false, true, 0, 1, '', 'string', [], {}] ) {
		test(`onEvent={${inspect(value)}} on event props is passed through as-is`, () => {
			const renderer = theMock('onEvent');

			const props = {
				onEvent: value,
			};

			const result = renderer.render(props);

			expect(result.props).toMatchObject(props);
		});
	}

	test('unset event properties are not present in props', () => {
		const renderer = theMock('onEvent');

		const props = {};

		const result = renderer.render(props);

		expect(result.props).not.toHaveProperty('onEvent');
	});

	test('An event prop re-renders when changing between falsy and function', () => {
		const renderer = theMock('onEvent');

		const result1 = renderer.render({onEvent: () => {}});
		expect(result1.count).toBe(1);

		const result2 = renderer.render({onEvent: false});
		expect(result2.count).toBe(2);

		const result3 = renderer.render({onEvent: () => {}});
		expect(result3.count).toBe(3);
	});
});

/**
 * guardPureEventProps
 */
describe('guardPureEventProps', () => {
	const theMock = guardMock;
	runUniversalTestsFor(theMock);
	runCommonTestsFor(theMock);

	for ( const value of [undefined, null, false, true, 0, 1, '', 'string', [], {}] ) {
		test(`onEvent={${inspect(value)}} is turned into a noop`, () => {
			const renderer = theMock('onEvent');

			const props = {
				onEvent: value,
			};

			const result = renderer.render(props);

			expect(result.props).toHaveProperty('onEvent');
			expect(typeof result.props.onEvent).toBe('function');
		});
	}

	test('unset event properties are made into noops', () => {
		const renderer = theMock('onEvent');

		const props = {};

		const result = renderer.render(props);

		expect(result.props).toHaveProperty('onEvent');
		expect(typeof result.props.onEvent).toBe('function');
	});
	test('An event prop does not re-render when changing between falsy and function', () => {
		const renderer = theMock('onEvent');

		const result1 = renderer.render({onEvent: () => {}});
		expect(result1.count).toBe(1);

		const result2 = renderer.render({onEvent: false});
		expect(result2.count).toBe(1);

		const result3 = renderer.render({onEvent: () => {}});
		expect(result3.count).toBe(1);
	});
});
