// frontend/src/components/user/GroupSelector.jsx

import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { useGroup } from '../../context/GroupContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function GroupSelector() {
  const { selectedGroup, userGroups, switchGroup, getSelectedGroupDetails } = useGroup();
  const currentGroup = getSelectedGroupDetails();

  if (!userGroups.length) {
    return (
      <div className="text-sm text-gray-500">
        Not in any groups. Join groups from the dashboard.
      </div>
    );
  }

  return (
    <Listbox value={selectedGroup} onChange={switchGroup}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-8 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 sm:text-sm sm:leading-6">
            <span className="block truncate font-medium">
              {currentGroup?.name || 'Select Group'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <span className="text-xs text-gray-400">▼</span>
            </span>
          </Listbox.Button>

          <Transition
            show={open}
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {userGroups.map((group) => (
                <Listbox.Option
                  key={group.id}
                  className={({ active }) =>
                    classNames(
                      active ? 'bg-amber-500 text-ipl-dark' : 'text-gray-900',
                      'relative cursor-default select-none py-2 pl-3 pr-9'
                    )
                  }
                  value={group.id}
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                          {group.name}
                        </span>
                        <span className={classNames(
                          'text-xs',
                          active ? 'text-white' : 'text-gray-500'
                        )}>
                          {group.points} pts
                        </span>
                      </div>

                      {selected ? (
                        <span
                          className={classNames(
                            active ? 'text-ipl-dark' : 'text-amber-600',
                            'absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold'
                          )}
                        >
                          Selected
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}