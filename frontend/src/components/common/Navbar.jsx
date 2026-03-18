// frontend/src/components/common/Navbar.jsx

import React, { Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

const navigation = (isAdmin) => {
  const items = [
    { name: 'Home', href: ROUTES.HOME, public: true },
    { name: 'Play', href: ROUTES.DASHBOARD, requiresAuth: true },
    { name: 'Points', href: ROUTES.POINTS, requiresAuth: true },
    { name: 'History', href: ROUTES.HISTORY, requiresAuth: true },
  ];

  if (isAdmin) {
    items.push({ name: 'Admin', href: ROUTES.ADMIN, admin: true });
  }

  return items;
};

const adminSubNav = [
  { name: 'Dashboard', href: ROUTES.ADMIN },
  { name: 'Matches', href: ROUTES.ADMIN_MATCHES },
  { name: 'Groups', href: ROUTES.ADMIN_GROUPS },
  { name: 'Users', href: ROUTES.ADMIN_USERS },
  { name: 'Tournament', href: ROUTES.ADMIN_TOURNAMENT },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME);
  };

  const getNavigation = () => {
    return navigation(isAdmin).filter(item => {
      if (item.public) return true;
      if (item.requiresAuth && isAuthenticated) return true;
      if (item.admin && isAdmin) return true;
      return false;
    });
  };

  const isAdminRoute = (path) => path?.startsWith('/admin');

  return (
    <Disclosure as="nav" className="bg-ipl-dark shadow-lg">
      {({ open }) => (
        <>
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link to={ROUTES.HOME} className="text-xl font-bold text-amber-400">
                    IPL 2026
                  </Link>
                </div>
                <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
                  {getNavigation().map((item) => (
                    <div key={item.name} className="flex items-center">
                      {item.admin ? (
                        <Menu as="div" className="relative">
                          <Menu.Button
                            className={classNames(
                              location.pathname === item.href || isAdminRoute(location.pathname)
                                ? 'bg-amber-600/30 text-amber-300'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                              'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md'
                            )}
                          >
                            {item.name}
                          </Menu.Button>
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute left-0 z-10 mt-1 w-48 origin-top-left rounded-md bg-ipl-dark py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
                              {adminSubNav.map((sub) => (
                                <Menu.Item key={sub.name}>
                                  {({ active }) => (
                                    <Link
                                      to={sub.href}
                                      className={classNames(
                                        location.pathname === sub.href
                                          ? 'bg-amber-600/20 text-amber-300'
                                          : active ? 'bg-gray-700 text-white' : 'text-gray-300',
                                        'block px-4 py-2 text-sm'
                                      )}
                                    >
                                      {sub.name}
                                    </Link>
                                  )}
                                </Menu.Item>
                              ))}
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      ) : (
                        <Link
                          to={item.href}
                          className={classNames(
                            location.pathname === item.href
                              ? 'bg-amber-600/30 text-amber-300'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                            'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md'
                          )}
                        >
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {isAuthenticated ? (
                  <Menu as="div" className="relative ml-3">
                    <Menu.Button className="flex rounded-full bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-ipl-dark">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-ipl-dark font-semibold">
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-ipl-dark py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
                        <Menu.Item>
                          {({ active }) => (
                            <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                              <p className="font-semibold">{user?.username}</p>
                              <p className="text-xs text-gray-400">
                                {isAdmin ? 'Administrator' : 'Player'}
                              </p>
                            </div>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={classNames(
                                active ? 'bg-gray-700' : '',
                                'block w-full text-left px-4 py-2 text-sm text-gray-300'
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="space-x-2">
                    <Link
                      to={ROUTES.LOGIN}
                      className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to={ROUTES.REGISTER}
                      className="bg-amber-500 text-ipl-dark hover:bg-amber-400 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500">
                  <span>{open ? 'Close' : 'Menu'}</span>
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden border-t border-gray-700">
            <div className="space-y-1 pb-3 pt-2 px-4">
              {getNavigation().map((item) => (
                <Fragment key={item.name}>
                  {item.admin ? (
                    adminSubNav.map((sub) => (
                      <Disclosure.Button
                        key={sub.name}
                        as={Link}
                        to={sub.href}
                        className={classNames(
                          location.pathname === sub.href
                            ? 'bg-amber-600/20 text-amber-300'
                            : 'text-gray-300 hover:bg-gray-700',
                          'block py-2 pl-4 text-base font-medium rounded-md'
                        )}
                      >
                        {sub.name}
                      </Disclosure.Button>
                    ))
                  ) : (
                    <Disclosure.Button
                      as={Link}
                      to={item.href}
                      className={classNames(
                        location.pathname === item.href
                          ? 'bg-amber-600/20 text-amber-300'
                          : 'text-gray-300 hover:bg-gray-700',
                        'block py-2 rounded-md text-base font-medium'
                      )}
                    >
                      {item.name}
                    </Disclosure.Button>
                  )}
                </Fragment>
              ))}
            </div>
            {isAuthenticated ? (
              <div className="border-t border-gray-700 pb-3 pt-4 px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-ipl-dark font-semibold text-lg">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user?.username}</div>
                    <div className="text-sm text-gray-400">
                      {isAdmin ? 'Administrator' : 'Player'}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Disclosure.Button
                    as="button"
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 rounded-md"
                  >
                    Sign out
                  </Disclosure.Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-700 pb-3 pt-4 px-4 space-y-1">
                <Disclosure.Button
                  as={Link}
                  to={ROUTES.LOGIN}
                  className="block py-2 text-base font-medium text-gray-300 hover:bg-gray-700 rounded-md"
                >
                  Login
                </Disclosure.Button>
                <Disclosure.Button
                  as={Link}
                  to={ROUTES.REGISTER}
                  className="block py-2 text-base font-medium text-amber-400 hover:bg-gray-700 rounded-md"
                >
                  Register
                </Disclosure.Button>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
